import { TICKER_KR } from '@/constants/stock-korean-names';
import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import type { StockReportStatus } from '@/types/stocks-report';
import type {
  AdminValuationItem,
  AdminValuationSectorGroup,
} from '@/types/valuation';
import { NextResponse } from 'next/server';

// GET /api/admin/valuation — 적정주가 스냅샷 + 수동 조정 성장률을 섹터별로 묶어 반환(ADMIN).
// ETF(StockSymbol.type='ETP')는 제외. 섹터 미지정(즐겨찾기 등)은 마지막 "기타" 그룹.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const [sectors, valuations] = await Promise.all([
    prisma.analysisSector.findMany({
      include: { items: { orderBy: [{ sortOrder: 'asc' }] } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.stockValuation.findMany({ orderBy: [{ symbol: 'asc' }] }),
  ]);

  const valBySym = new Map(valuations.map((v) => [v.symbol, v]));
  const stockRows = await prisma.stockSymbol.findMany({
    where: { symbol: { in: valuations.map((v) => v.symbol) } },
    select: { symbol: true, type: true, description: true },
  });
  const typeBySym = new Map(stockRows.map((s) => [s.symbol, s.type]));
  const descBySym = new Map(stockRows.map((s) => [s.symbol, s.description]));

  const isEtf = (symbol: string) => typeBySym.get(symbol) === 'ETP';
  const toItem = (
    v: (typeof valuations)[number],
  ): AdminValuationItem => ({
    symbol: v.symbol,
    name: TICKER_KR[v.symbol] ?? descBySym.get(v.symbol) ?? v.symbol,
    price: v.price,
    growthPct: v.growthPct,
    growthOverride: v.growthOverride,
    growthSource: v.growthSource,
    fairValue: v.fairValue,
    upsidePct: v.upsidePct,
    status: v.status as StockReportStatus,
    snapshotAt: v.snapshotAt.toISOString(),
  });

  const used = new Set<string>();
  const groups: AdminValuationSectorGroup[] = [];

  for (const sector of sectors) {
    const items: AdminValuationItem[] = [];
    for (const it of sector.items) {
      const v = valBySym.get(it.symbol);
      if (!v || isEtf(it.symbol)) continue; // 스냅샷 없거나 ETF면 제외
      used.add(it.symbol);
      items.push(toItem(v));
    }
    if (items.length > 0) {
      groups.push({
        sectorId: sector.id,
        sectorName: sector.name,
        slug: sector.slug,
        items,
      });
    }
  }

  // 어느 섹터에도 안 든 개별종목(즐겨찾기 등) → "기타".
  const others = valuations
    .filter((v) => !used.has(v.symbol) && !isEtf(v.symbol))
    .map(toItem);
  if (others.length > 0) {
    groups.push({
      sectorId: null,
      sectorName: '기타 (섹터 미지정)',
      slug: null,
      items: others,
    });
  }

  return NextResponse.json(groups);
}
