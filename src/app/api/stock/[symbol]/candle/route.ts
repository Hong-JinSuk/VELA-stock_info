import { getDailyCloses } from '@/lib/api/yahoo';
import type { StockCandlePoint } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 종가 시계열. Finnhub 무료티어는 candle을 안 줘서 Yahoo에서 받는다.
// 앱 range → Yahoo {interval, range}. 1d/5d는 intraday(분봉), 나머지는 일봉.
const RANGE_MAP: Record<string, { interval: string; range: string }> = {
  '1d': { interval: '5m', range: '1d' },
  '5d': { interval: '15m', range: '5d' },
  '1mo': { interval: '1d', range: '1mo' },
  '6mo': { interval: '1d', range: '6mo' },
  '1y': { interval: '1d', range: '1y' },
  ytd: { interval: '1d', range: 'ytd' },
};

const fetchCandles = async (
  symbol: string,
  range: string,
  interval: string,
): Promise<StockCandlePoint[]> => getDailyCloses(symbol, range, interval);

// 일봉은 1시간 캐시, intraday(1d/5d)는 장중에 자주 변하므로 2분 캐시. (둘 다 (sym,range,interval)별)
const cachedDaily = unstable_cache(fetchCandles, ['stock-candle-daily'], {
  revalidate: 3600,
  tags: ['stock-candle'],
});
const cachedIntraday = unstable_cache(fetchCandles, ['stock-candle-intraday'], {
  revalidate: 120,
  tags: ['stock-candle'],
});

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  const rangeParam = req.nextUrl.searchParams.get('range') ?? '6mo';
  const key = RANGE_MAP[rangeParam] ? rangeParam : '6mo';
  const { interval, range } = RANGE_MAP[key];
  const isIntraday = key === '1d' || key === '5d';
  try {
    const candles = await (isIntraday ? cachedIntraday : cachedDaily)(
      sym,
      range,
      interval,
    );
    return NextResponse.json(candles);
  } catch (e) {
    console.error('[STOCK_CANDLE] failed:', sym, e);
    const message = e instanceof Error ? e.message : '차트 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
