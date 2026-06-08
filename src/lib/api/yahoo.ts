// Yahoo Finance 차트(과거 주가) 서버 전용 클라이언트.
// Finnhub 무료티어가 candle(과거 주가)을 안 줘서, 6개월 일봉은 Yahoo에서 받는다.
// ⚠️ 비공식 엔드포인트라 언제든 막힐 수 있음(특히 클라우드 IP). best-effort: 실패 시 빈 배열.
import axios from 'axios';
import type { StockCandlePoint } from '@/types/stock';

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
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

// symbol의 일봉 종가 시계열. range 예: '6mo', '1y'.
export async function getDailyCloses(
  symbol: string,
  range = '6mo',
): Promise<StockCandlePoint[]> {
  // Yahoo는 클래스 주식에 점(.) 대신 대시(-)를 쓴다 (BRK.B → BRK-B, BF.B → BF-B).
  const yahooSymbol = symbol.replace(/\./g, '-');
  try {
    const { data } = await axios.get<YahooChartResponse>(
      `${YAHOO_CHART_BASE}/${encodeURIComponent(yahooSymbol)}`,
      {
        params: { interval: '1d', range },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000,
      },
    );
    const result = data.chart?.result?.[0];
    const ts = result?.timestamp;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!ts || !closes) return [];

    const points: StockCandlePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null || !Number.isFinite(c)) continue; // 휴장일 등 null 스킵
      points.push({
        date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
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
