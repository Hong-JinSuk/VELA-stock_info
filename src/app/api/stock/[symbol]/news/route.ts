import { getStockNews } from '@/lib/api/stock-news';
import type { StockNewsItem } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// Finnhub 영문 뉴스 + Google RSS 국내 뉴스 병합. 30분 캐시.
const cachedNews = unstable_cache(
  async (symbol: string, name: string): Promise<StockNewsItem[]> =>
    getStockNews(symbol, name || undefined),
  ['stock-news'],
  { revalidate: 1800, tags: ['stock-news'] },
);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  // 국내 RSS 검색 품질을 위해 회사명(한글/영문)을 받는다. 없으면 심볼로 검색.
  const name = (req.nextUrl.searchParams.get('name') ?? '').trim();
  try {
    const news = await cachedNews(sym, name);
    return NextResponse.json(news);
  } catch (e) {
    console.error('[STOCK_NEWS] failed:', sym, e);
    const message = e instanceof Error ? e.message : '뉴스 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
