// Finnhub API 서버 전용 클라이언트.
// ⚠️ 반드시 서버사이드(route handler)에서만 import. FINNHUB_API_KEY가 클라에 노출되면 안 됨.
// CLAUDE.md "API Calls" 원칙대로 fetch 대신 axios 인스턴스 사용.
import axios from 'axios';
import type {
  AnalystRecommendation,
  StockMetrics,
  StockProfile,
  StockQuote,
  StockSearchItem,
} from '@/types/stock';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// 외부 호출 전용 인스턴스 (앱 내부 호출용 src/lib/api/axios.ts의 `api`와 분리:
// baseURL/withCredentials/클라 toast 인터셉터가 서버 외부호출에 안 맞음).
const finnhub = axios.create({ baseURL: FINNHUB_BASE, timeout: 10000 });

// Finnhub 무료티어 rate-limit(60/min) 초과 시 던지는 에러.
// route에서 429 + 이 메시지로 반환 → 클라 QueryCache.onError가 toast로 표시.
export class FinnhubRateLimitError extends Error {
  constructor() {
    super('현재 사용량이 많아 잠시 후 시도해 주세요.');
    this.name = 'FinnhubRateLimitError';
  }
}

finnhub.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new FinnhubRateLimitError();
    }
    throw error;
  },
);

function token(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('[FINNHUB] FINNHUB_API_KEY env not set');
  return key;
}

// metric 객체에서 여러 후보 키 중 첫 유효값을 number로 뽑는다 (Finnhub 키 명칭이 버전마다 다름).
function pick(
  metric: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const k of keys) {
    const v = metric[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

export async function searchSymbol(q: string): Promise<StockSearchItem[]> {
  const { data } = await finnhub.get<{
    count: number;
    result?: Array<{
      symbol: string;
      displaySymbol: string;
      description: string;
      type: string;
    }>;
  }>('/search', { params: { q, token: token() } });
  // 보통주(Common Stock) 우선, 그 외 타입은 뒤로.
  return (data.result ?? []).map((r) => ({
    symbol: r.symbol,
    displaySymbol: r.displaySymbol,
    description: r.description,
    type: r.type,
  }));
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  const { data } = await finnhub.get<{
    c: number;
    d: number | null;
    dp: number | null;
    h: number;
    l: number;
    o: number;
    pc: number;
  }>('/quote', { params: { symbol, token: token() } });
  return {
    current: data.c,
    change: data.d ?? 0,
    percentChange: data.dp ?? 0,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
  };
}

export async function getProfile(symbol: string): Promise<StockProfile | null> {
  const { data } = await finnhub.get<Record<string, unknown>>(
    '/stock/profile2',
    { params: { symbol, token: token() } },
  );
  // 존재하지 않는 심볼이면 빈 객체 반환.
  if (!data || !data.name) return null;
  return {
    name: String(data.name),
    ticker: String(data.ticker ?? symbol),
    exchange: String(data.exchange ?? ''),
    industry: String(data.finnhubIndustry ?? ''),
    logo: String(data.logo ?? ''),
    weburl: String(data.weburl ?? ''),
    currency: String(data.currency ?? 'USD'),
    marketCap:
      typeof data.marketCapitalization === 'number'
        ? data.marketCapitalization
        : null,
    country: String(data.country ?? ''),
  };
}

export async function getMetrics(symbol: string): Promise<StockMetrics> {
  const { data } = await finnhub.get<{ metric?: Record<string, unknown> }>(
    '/stock/metric',
    { params: { symbol, metric: 'all', token: token() } },
  );
  const m = data.metric ?? {};
  return {
    high52w: pick(m, ['52WeekHigh']),
    low52w: pick(m, ['52WeekLow']),
    priceReturn52w: pick(m, ['52WeekPriceReturnDaily']),
    dividendYield: pick(m, [
      'dividendYieldIndicatedAnnual',
      'currentDividendYieldTTM',
    ]),
    peAnnual: pick(m, ['peAnnual', 'peExclExtraAnnual', 'peTTM']),
    pbAnnual: pick(m, ['pbAnnual', 'pbQuarterly']),
    psAnnual: pick(m, ['psAnnual', 'psTTM']),
    epsAnnual: pick(m, ['epsAnnual', 'epsExclExtraItemsAnnual', 'epsTTM']),
    beta: pick(m, ['beta']),
    revenueGrowthTTM: pick(m, ['revenueGrowthTTMYoy']),
    operatingMarginTTM: pick(m, ['operatingMarginTTM']),
    netMarginTTM: pick(m, ['netProfitMarginTTM', 'netMarginTTM']),
    roiTTM: pick(m, ['roiTTM']),
    roeTTM: pick(m, ['roeTTM']),
    roaTTM: pick(m, ['roaTTM']),
    currentRatioQuarterly: pick(m, ['currentRatioQuarterly']),
  };
}

export async function getRecommendation(
  symbol: string,
): Promise<AnalystRecommendation | null> {
  const { data } = await finnhub.get<
    Array<{
      period: string;
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    }>
  >('/stock/recommendation', { params: { symbol, token: token() } });
  // 최신 period가 배열 맨 앞.
  const latest = data?.[0];
  if (!latest) return null;
  const total =
    latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  return { ...latest, total };
}

// Finnhub insider-transactions 원본 (분석은 insider-analysis.ts에서).
export type RawInsiderTx = {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
};

export async function getInsiderTransactions(
  symbol: string,
  from: string,
  to: string,
): Promise<RawInsiderTx[]> {
  const { data } = await finnhub.get<{ data?: RawInsiderTx[] }>(
    '/stock/insider-transactions',
    { params: { symbol, from, to, token: token() } },
  );
  return data.data ?? [];
}

export type RawCompanyNews = {
  category: string;
  datetime: number; // unix sec
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string,
): Promise<RawCompanyNews[]> {
  const { data } = await finnhub.get<RawCompanyNews[]>('/company-news', {
    params: { symbol, from, to, token: token() },
  });
  return data ?? [];
}
