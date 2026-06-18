import type { StockCandlePoint } from '@/types/stock';

// ETF 성과 테이블 기간 키 (섹터 지표 SectorPeriodKey와 별개 — 6달/1년 추가).
export type EtfPeriodKey = 'd1' | 'w1' | 'm1' | 'm3' | 'm6' | 'ytd' | 'y1';

// sparkline에 보낼 최근 종가 수.
export const TREND_POINTS = 30;

// 거래일 기준 기간 (ytd/y1은 별도 처리).
const TRADING_DAYS: Record<'d1' | 'w1' | 'm1' | 'm3' | 'm6', number> = {
  d1: 1,
  w1: 5,
  m1: 21,
  m3: 63,
  m6: 126,
};

// 일별 종가 시계열 → 기간별 수익률(%). 데이터 부족이면 null.
// /api/stock/etf-performance(섹터 분석 ETF 테이블)가 사용.
export function computeReturns(
  closes: StockCandlePoint[],
): Record<EtfPeriodKey, number | null> {
  const result: Record<EtfPeriodKey, number | null> = {
    d1: null,
    w1: null,
    m1: null,
    m3: null,
    m6: null,
    ytd: null,
    y1: null,
  };
  const last = closes[closes.length - 1];
  if (!last) return result;

  for (const key of Object.keys(TRADING_DAYS) as Array<keyof typeof TRADING_DAYS>) {
    const base = closes[closes.length - 1 - TRADING_DAYS[key]];
    if (base && base.close > 0) {
      result[key] = (last.close / base.close - 1) * 100;
    }
  }

  // 1년: 252거래일 전(없으면 1y 윈도우의 가장 오래된 종가) 대비.
  const yearBase = closes[closes.length - 1 - 252] ?? closes[0];
  if (yearBase && yearBase.close > 0 && yearBase !== last) {
    result.y1 = (last.close / yearBase.close - 1) * 100;
  }

  // YTD = 전년도 마지막 거래일 종가 대비.
  const yearStart = `${last.date.slice(0, 4)}-01-01`;
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i].date < yearStart) {
      if (closes[i].close > 0) {
        result.ytd = (last.close / closes[i].close - 1) * 100;
      }
      break;
    }
  }
  return result;
}
