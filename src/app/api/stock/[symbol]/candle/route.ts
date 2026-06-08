import { getDailyCloses } from '@/lib/api/yahoo';
import type { StockCandlePoint } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 일봉 종가. Finnhub 무료티어는 candle을 안 줘서 Yahoo에서 받는다.
// range: 1mo | 6mo | 1y | ytd (Yahoo range 값과 동일). 1시간 캐시(range별).
const ALLOWED_RANGES = new Set(['1mo', '6mo', '1y', 'ytd']);

const cachedCandle = unstable_cache(
  async (symbol: string, range: string): Promise<StockCandlePoint[]> =>
    getDailyCloses(symbol, range),
  ['stock-candle'],
  { revalidate: 3600, tags: ['stock-candle'] },
);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  const rangeParam = req.nextUrl.searchParams.get('range') ?? '6mo';
  const range = ALLOWED_RANGES.has(rangeParam) ? rangeParam : '6mo';
  try {
    const candles = await cachedCandle(sym, range);
    return NextResponse.json(candles);
  } catch (e) {
    console.error('[STOCK_CANDLE] failed:', sym, e);
    const message = e instanceof Error ? e.message : '차트 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
