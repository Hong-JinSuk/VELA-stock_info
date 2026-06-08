import {
  FinnhubRateLimitError,
  getMetrics,
  getProfile,
  getQuote,
  getRecommendation,
} from '@/lib/api/finnhub';
import type { StockDetail } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 종목 기본정보: 프로필 + 시세 + 주요지표 + 애널리스트 의견.
// 시세가 섞여 있어 60초 캐시 (intraday 변동 반영하되 rate-limit 보호).
const cachedDetail = unstable_cache(
  async (symbol: string): Promise<StockDetail | null> => {
    const [profile, quote, metrics, recommendation] = await Promise.all([
      getProfile(symbol),
      getQuote(symbol),
      getMetrics(symbol),
      getRecommendation(symbol),
    ]);
    if (!profile) return null;
    return { profile, quote, metrics, recommendation };
  },
  ['stock-detail'],
  { revalidate: 60, tags: ['stock-detail'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  try {
    const detail = await cachedDetail(sym);
    if (!detail) {
      return NextResponse.json(
        { message: '종목을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_DETAIL] failed:', sym, e);
    const message = e instanceof Error ? e.message : '종목 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
