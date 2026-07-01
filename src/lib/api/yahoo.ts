// Yahoo Finance 차트(과거 주가) 서버 전용 클라이언트.
// Finnhub 무료티어가 candle(과거 주가)을 안 줘서, 6개월 일봉은 Yahoo에서 받는다.
// 목표주가(price target)도 Finnhub는 유료라 Yahoo financialData에서 받는다.
// ⚠️ 비공식 엔드포인트라 언제든 막힐 수 있음(특히 클라우드 IP). best-effort: 실패 시 빈 배열/null.
import axios from 'axios';
import type {
  PriceTarget,
  StockCandlePoint,
  StockIntradayPoint,
} from '@/types/stock';

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QS_BASE = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
const USER_AGENT = 'Mozilla/5.0 (vela stock chart)';

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

// symbol의 종가 시계열. interval 기본 일봉('1d'); '5m'/'15m' 등이면 intraday.
// range 예: 일봉 '6mo'·'1y'·'ytd', intraday '1d'(당일)·'5d'(주간).
export async function getDailyCloses(
  symbol: string,
  range = '6mo',
  interval = '1d',
): Promise<StockCandlePoint[]> {
  // Yahoo는 클래스 주식에 점(.) 대신 대시(-)를 쓴다 (BRK.B → BRK-B, BF.B → BF-B).
  const yahooSymbol = symbol.replace(/\./g, '-');
  try {
    const { data } = await axios.get<YahooChartResponse>(
      `${YAHOO_CHART_BASE}/${encodeURIComponent(yahooSymbol)}`,
      {
        params: { interval, range },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000,
      },
    );
    const result = data.chart?.result?.[0];
    const ts = result?.timestamp;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!ts || !closes) return [];

    const isDaily = interval === '1d';
    const points: StockCandlePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null || !Number.isFinite(c)) continue; // 휴장일/거래 없는 구간 null 스킵
      const iso = new Date(ts[i] * 1000).toISOString();
      points.push({
        // 일봉은 날짜(YYYY-MM-DD), intraday(분/시간봉)는 고유+시각표시용 ISO datetime.
        date: isDaily ? iso.slice(0, 10) : iso,
        close: c,
      });
    }
    return points;
  } catch (e) {
    console.error(
      '[YAHOO_CHART] failed:',
      symbol,
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}

// 당일(1일) 인트라데이 시세 — 5분봉 종가 시계열. 즐겨찾기 미니 차트용.
// 장중이면 당일, 장 마감/주말이면 직전 거래일 데이터를 돌려준다(Yahoo range=1d 동작).
const ET_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export async function getIntraday(
  symbol: string,
): Promise<StockIntradayPoint[]> {
  const yahooSymbol = symbol.replace(/\./g, '-');
  try {
    const { data } = await axios.get<YahooChartResponse>(
      `${YAHOO_CHART_BASE}/${encodeURIComponent(yahooSymbol)}`,
      {
        params: { interval: '5m', range: '1d' },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000,
      },
    );
    const result = data.chart?.result?.[0];
    const ts = result?.timestamp;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!ts || !closes) return [];

    const points: StockIntradayPoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null || !Number.isFinite(c)) continue; // 거래 없는 구간 스킵
      points.push({
        time: ET_TIME.format(new Date(ts[i] * 1000)), // 미 동부 HH:mm
        close: c,
      });
    }
    return points;
  } catch (e) {
    console.error(
      '[YAHOO_INTRADAY] failed:',
      symbol,
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}

// ---- 목표주가 (quoteSummary financialData, crumb 인증 필요) ----

// cookie+crumb 세션 (모듈 캐시, 30분 TTL). 호출마다 핸드셰이크하지 않도록 재사용.
let session: { cookie: string; crumb: string; at: number } | null = null;
const SESSION_TTL = 30 * 60 * 1000;

async function getSession(force = false): Promise<{ cookie: string; crumb: string }> {
  if (!force && session && Date.now() - session.at < SESSION_TTL) {
    return { cookie: session.cookie, crumb: session.crumb };
  }
  const cookieRes = await axios.get('https://fc.yahoo.com/', {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000,
    validateStatus: () => true,
  });
  const setCookies: string[] = cookieRes.headers['set-cookie'] ?? [];
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('[YAHOO] cookie 획득 실패');

  const crumbRes = await axios.get(
    'https://query1.finance.yahoo.com/v1/test/getcrumb',
    {
      headers: { 'User-Agent': USER_AGENT, Cookie: cookie },
      responseType: 'text',
      timeout: 10000,
    },
  );
  const crumb = String(crumbRes.data).trim();
  if (!crumb || crumb.includes('<')) throw new Error('[YAHOO] crumb 획득 실패');
  session = { cookie, crumb, at: Date.now() };
  return { cookie, crumb };
}

type FinancialData = {
  currentPrice?: { raw?: number };
  targetMeanPrice?: { raw?: number };
  targetHighPrice?: { raw?: number };
  targetLowPrice?: { raw?: number };
  numberOfAnalystOpinions?: { raw?: number };
};

async function fetchFinancialData(
  yahooSymbol: string,
  s: { cookie: string; crumb: string },
): Promise<FinancialData | null> {
  const res = await axios.get<{
    quoteSummary?: { result?: Array<{ financialData?: FinancialData }> };
  }>(`${YAHOO_QS_BASE}/${encodeURIComponent(yahooSymbol)}`, {
    params: { modules: 'financialData', crumb: s.crumb },
    headers: { 'User-Agent': USER_AGENT, Cookie: s.cookie },
    timeout: 10000,
    validateStatus: () => true,
  });
  if (res.status === 401) throw new Error('CRUMB_EXPIRED');
  return res.data?.quoteSummary?.result?.[0]?.financialData ?? null;
}

// 애널리스트 목표주가 컨센서스. 목표가가 없으면(ETF·미커버 종목) null. best-effort.
export async function getPriceTarget(symbol: string): Promise<PriceTarget | null> {
  const yahooSymbol = symbol.replace(/\./g, '-'); // BRK.B → BRK-B
  try {
    let s = await getSession();
    let fd: FinancialData | null;
    try {
      fd = await fetchFinancialData(yahooSymbol, s);
    } catch (e) {
      if (e instanceof Error && e.message === 'CRUMB_EXPIRED') {
        s = await getSession(true); // crumb 만료 → 재핸드셰이크 후 1회 재시도
        fd = await fetchFinancialData(yahooSymbol, s);
      } else {
        throw e;
      }
    }
    const mean = fd?.targetMeanPrice?.raw;
    const current = fd?.currentPrice?.raw;
    if (
      typeof mean !== 'number' ||
      typeof current !== 'number' ||
      mean <= 0 ||
      current <= 0
    ) {
      return null; // 목표가 미제공
    }
    return {
      mean,
      high: fd?.targetHighPrice?.raw ?? mean,
      low: fd?.targetLowPrice?.raw ?? mean,
      current,
      count: fd?.numberOfAnalystOpinions?.raw ?? 0,
    };
  } catch (e) {
    console.error(
      '[YAHOO_TARGET] failed:',
      symbol,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}
