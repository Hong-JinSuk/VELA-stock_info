import { FinnhubRateLimitError, searchSymbol } from '@/lib/api/finnhub';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 심볼/회사명 검색. 쿼리별 1시간 캐시.
const cachedSearch = unstable_cache(
  async (q: string) => searchSymbol(q),
  ['stock-search'],
  { revalidate: 3600, tags: ['stock-search'] },
);

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) return NextResponse.json([]);
  try {
    const items = await cachedSearch(q);
    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_SEARCH] failed:', e);
    const message = e instanceof Error ? e.message : '검색 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
