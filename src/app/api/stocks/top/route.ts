import { krNameOf } from '@/constants/stock-korean-names';
import prisma from '@/lib/prisma';
import type { TopStock } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 인기 대형주 TOP20은 배치(top-stocks)가 갱신 → 자주 안 바뀌므로 10분 캐시.
// 배치가 끝나면 revalidateVela('top-stocks')로 즉시 무효화한다.
const REVALIDATE_SECONDS = 60 * 10;

const getTopStocks = unstable_cache(
  async (): Promise<TopStock[]> => {
    const rows = await prisma.topStockQuote.findMany({
      orderBy: { rank: 'asc' },
    });
    return rows.map((r) => ({
      symbol: r.symbol,
      rank: r.rank,
      name: r.name,
      kr: krNameOf(r.symbol) ?? null,
      price: r.price,
      change: r.change,
      changePercent: r.changePercent,
      snapshotAt: r.snapshotAt ? r.snapshotAt.toISOString() : null,
      marketCap: r.marketCap,
      logo: r.logo,
      high52w: r.high52w,
      low52w: r.low52w,
      priceReturn52w: r.priceReturn52w,
      recBuy: r.recBuy,
      recHold: r.recHold,
      recSell: r.recSell,
      spark: r.spark,
    }));
  },
  ['top-stocks-v2'],
  { revalidate: REVALIDATE_SECONDS, tags: ['top-stocks'] },
);

// GET /api/stocks/top — 인기 대형주 TOP20 시세 스냅샷 (고정 세트라 bare array).
export async function GET() {
  try {
    const items = await getTopStocks();
    return NextResponse.json(items);
  } catch (error) {
    console.error('[TOP_STOCKS] failed:', error);
    return NextResponse.json({ message: 'TOP 종목 조회 실패' }, { status: 500 });
  }
}
