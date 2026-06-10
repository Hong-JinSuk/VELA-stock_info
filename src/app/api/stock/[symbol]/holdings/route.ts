import { TICKER_KR } from '@/constants/stock-korean-names';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { EtfHoldingsData } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// ETF 상위 보유종목(top-10) + 자산배분 + 직전 대비 편입/편출 + 순위변동(prevRank).
// gemini-server 배치가 Yahoo topHoldings에서 받아 StockSymbolEtf/Holding에 적재한 것을 읽기만 한다.
// 미적재 ETF(배치 미도달)는 null. 종목명은 한국어명(TICKER_KR) 우선 적용.
// $queryRaw 사용: dev 서버가 캐시한 옛 Prisma client에 신규 컬럼(prevRank)이 없어도
// raw SQL은 select한 컬럼을 그대로 반환하므로 client 상태와 무관(detail/search route와 동일 패턴).
type EtfRow = {
  stockPct: number | null;
  bondPct: number | null;
  cashPct: number | null;
  entered: string[];
  exited: string[];
  updatedAt: Date;
};
type HoldingRow = {
  rank: number;
  prevRank: number | null;
  symbol: string | null;
  name: string;
  weight: number;
};

const cachedHoldings = unstable_cache(
  async (symbol: string): Promise<EtfHoldingsData | null> => {
    const etfRows = await prisma.$queryRaw<EtfRow[]>(Prisma.sql`
      SELECT "stockPct", "bondPct", "cashPct", entered, exited, "updatedAt"
      FROM "StockSymbolEtf" WHERE symbol = ${symbol} LIMIT 1
    `);
    const etf = etfRows[0];
    if (!etf) return null;

    const holdings = await prisma.$queryRaw<HoldingRow[]>(Prisma.sql`
      SELECT rank, "prevRank", symbol, name, weight
      FROM "StockSymbolEtfHolding" WHERE "etfSymbol" = ${symbol} ORDER BY rank ASC
    `);
    if (holdings.length === 0) return null;

    return {
      stockPct: etf.stockPct,
      bondPct: etf.bondPct,
      cashPct: etf.cashPct,
      entered: etf.entered,
      exited: etf.exited,
      holdings: holdings.map((h) => ({
        rank: h.rank,
        prevRank: h.prevRank,
        symbol: h.symbol,
        name: (h.symbol && TICKER_KR[h.symbol]) || h.name,
        weight: h.weight,
      })),
      updatedAt: etf.updatedAt.toISOString(),
    };
  },
  ['etf-holdings'],
  { revalidate: 3600, tags: ['etf-holdings'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  try {
    // 미적재 ETF는 200 + null ("데이터 없음" — overview/insight와 동일 패턴, 에러 toast 회피).
    const data = await cachedHoldings(sym);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[ETF_HOLDINGS] failed:', sym, e);
    const message = e instanceof Error ? e.message : '보유종목 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
