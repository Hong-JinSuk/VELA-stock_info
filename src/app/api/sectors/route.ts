import { SECTOR_ETFS } from '@/constants/sector-etfs';
import { getDailyCloses } from '@/lib/api/yahoo';
import type { StockCandlePoint } from '@/types/stock';
import type { SectorPerformance, SectorPeriodKey } from '@/types/sector';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

const TREND_POINTS = 30; // sparkline에 보낼 최근 종가 수
const YAHOO_CHUNK_SIZE = 6; // 비공식 API라 동시 호출 수 제한
// 거래일 기준 기간 (ytd는 날짜 기준이라 별도 처리).
const TRADING_DAYS: Record<Exclude<SectorPeriodKey, 'ytd'>, number> = {
  d1: 1,
  w1: 5,
  m1: 21,
  m3: 63,
};

function computeReturns(
  closes: StockCandlePoint[],
): Record<SectorPeriodKey, number | null> {
  const result: Record<SectorPeriodKey, number | null> = {
    d1: null,
    w1: null,
    m1: null,
    m3: null,
    ytd: null,
  };
  const last = closes[closes.length - 1];
  if (!last) return result;

  for (const key of Object.keys(TRADING_DAYS) as Array<
    Exclude<SectorPeriodKey, 'ytd'>
  >) {
    const base = closes[closes.length - 1 - TRADING_DAYS[key]];
    if (base && base.close > 0) {
      result[key] = (last.close / base.close - 1) * 100;
    }
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

// 고정 세트(17개) 전체를 한 번에 계산해 10분 캐시. Yahoo 실패 ETF는 제외(best-effort).
const cachedSectorPerformance = unstable_cache(
  async (): Promise<SectorPerformance[]> => {
    const items: SectorPerformance[] = [];
    for (let i = 0; i < SECTOR_ETFS.length; i += YAHOO_CHUNK_SIZE) {
      const chunk = SECTOR_ETFS.slice(i, i + YAHOO_CHUNK_SIZE);
      const series = await Promise.all(
        chunk.map((etf) => getDailyCloses(etf.ticker, '1y')),
      );
      chunk.forEach((etf, j) => {
        const closes = series[j];
        const last = closes[closes.length - 1];
        if (!last) return;
        items.push({
          ...etf,
          price: last.close,
          returns: computeReturns(closes),
          trend: closes.slice(-TREND_POINTS).map((c) => c.close),
        });
      });
    }
    return items;
  },
  ['sector-performance'],
  { revalidate: 600, tags: ['sector-performance'] },
);

export async function GET() {
  try {
    const items = await cachedSectorPerformance();
    // 고정 세트 bounded 목록 → bare array (API Response 표준의 예외 케이스).
    return NextResponse.json(items);
  } catch (e) {
    console.error('[SECTORS] failed:', e);
    const message = e instanceof Error ? e.message : '섹터 데이터 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
