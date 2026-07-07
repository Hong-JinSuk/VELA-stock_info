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
// ETF(StockSymbol.type='ETP')는 제외. "섹터 미지정" 그룹은 관리자가 직접 등록한 ValuationWatch만
// 노출한다(유저 즐겨찾기는 유저 종목 보고서용으로 계속 스냅샷하되 여기엔 자동 노출하지 않는다).
// 아직 스냅샷이 안 된 watch 종목은 status='PENDING' 자리표시로 내려 즉시 보이게 한다.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const [sectors, valuations, watch] = await Promise.all([
    prisma.analysisSector.findMany({
      include: { items: { orderBy: [{ sortOrder: 'asc' }] } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.stockValuation.findMany({ orderBy: [{ symbol: 'asc' }] }),
    prisma.valuationWatch.findMany({ orderBy: [{ symbol: 'asc' }] }),
  ]);

  const valBySym = new Map(valuations.map((v) => [v.symbol, v]));
  // watch 종목은 스냅샷이 없을 수도 있으니 이름/타입 조회 대상에 함께 포함.
  const nameSymbols = [
    ...new Set([
      ...valuations.map((v) => v.symbol),
      ...watch.map((w) => w.symbol),
    ]),
  ];
  const stockRows = await prisma.stockSymbol.findMany({
    where: { symbol: { in: nameSymbols } },
    select: { symbol: true, type: true, description: true },
  });
  const typeBySym = new Map(stockRows.map((s) => [s.symbol, s.type]));
  const descBySym = new Map(stockRows.map((s) => [s.symbol, s.description]));

  const isEtf = (symbol: string) => typeBySym.get(symbol) === 'ETP';
  const nameOf = (symbol: string) =>
    TICKER_KR[symbol] ?? descBySym.get(symbol) ?? symbol;
  const toItem = (v: (typeof valuations)[number]): AdminValuationItem => ({
    symbol: v.symbol,
    name: nameOf(v.symbol),
    price: v.price,
    growthPct: v.growthPct,
    growthOverride: v.growthOverride,
    growthSource: v.growthSource,
    fairValue: v.fairValue,
    upsidePct: v.upsidePct,
    status: v.status as StockReportStatus,
    snapshotAt: v.snapshotAt.toISOString(),
  });
  // 스냅샷 전(신규 watch) 자리표시.
  const toPending = (symbol: string): AdminValuationItem => ({
    symbol,
    name: nameOf(symbol),
    price: null,
    growthPct: null,
    growthOverride: null,
    growthSource: '',
    fairValue: null,
    upsidePct: null,
    status: 'PENDING',
    snapshotAt: null,
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

  // "섹터 미지정" = 관리자 수동 등록(ValuationWatch)만. 섹터에 이미 든 종목·ETF는 제외.
  const others: AdminValuationItem[] = [];
  for (const w of watch) {
    if (used.has(w.symbol) || isEtf(w.symbol)) continue;
    const v = valBySym.get(w.symbol);
    others.push(v ? toItem(v) : toPending(w.symbol));
  }
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
