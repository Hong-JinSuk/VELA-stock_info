import { TICKER_KR } from '@/constants/stock-korean-names';
import { assertRouteAccess } from '@/lib/auth/route-access';
import prisma from '@/lib/prisma';
import type {
  AnalysisSectorDetail,
  AnalysisSectorRow,
} from '@/types/analysis';
import type { StockReportStatus } from '@/types/stocks-report';
import { NextResponse } from 'next/server';

// GET /api/analysis/sectors/[slug] — 섹터 상세 + 종목별 적정주가(StockValuation join).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const denied = await assertRouteAccess('analysis-sectors');
  if (denied) return denied;

  const { slug } = await params;
  const sector = await prisma.analysisSector.findUnique({
    where: { slug },
    include: {
      items: { orderBy: [{ sortOrder: 'asc' }] },
      indicators: { orderBy: [{ sortOrder: 'asc' }] },
    },
  });
  if (!sector) {
    return NextResponse.json(
      { message: '섹터를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  // 심볼 타입(ETP=ETF) + 영문명 + 적정주가 스냅샷 조회.
  const symbols = sector.items.map((it) => it.symbol);
  const [stockRows, valuations] = await Promise.all([
    prisma.stockSymbol.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, type: true, description: true },
    }),
    prisma.stockValuation.findMany({ where: { symbol: { in: symbols } } }),
  ]);
  const typeBySym = new Map(stockRows.map((s) => [s.symbol, s.type]));
  const descBySym = new Map(stockRows.map((s) => [s.symbol, s.description]));
  const valBySym = new Map(valuations.map((v) => [v.symbol, v]));

  // sortOrder 순서 유지하며 ETF/종목 통합 목록 구성(행 펼침용).
  const items: AnalysisSectorRow[] = sector.items.map((it) => {
    const symbol = it.symbol;
    const name = TICKER_KR[symbol] ?? descBySym.get(symbol) ?? symbol;
    const note = it.note;

    if (typeBySym.get(symbol) === 'ETP') {
      return { kind: 'ETF', symbol, name, note };
    }

    const v = valBySym.get(symbol);
    if (!v) {
      return {
        kind: 'STOCK',
        symbol,
        name,
        note,
        status: 'PENDING',
        price: null,
        roaTtm: null,
        fairValue: null,
        upsidePct: null,
        snapshotAt: null,
        growthPct: null,
        growthSource: null,
        high52w: null,
      };
    }
    return {
      kind: 'STOCK',
      symbol,
      name,
      note,
      status: v.status as StockReportStatus,
      price: v.price,
      roaTtm: v.roaTtm,
      fairValue: v.fairValue,
      upsidePct: v.upsidePct,
      snapshotAt: v.snapshotAt.toISOString(),
      growthPct: v.growthPct,
      growthSource: v.growthSource,
      high52w: v.high52w,
    };
  });

  const detail: AnalysisSectorDetail = {
    id: sector.id,
    slug: sector.slug,
    name: sector.name,
    description: sector.description,
    items,
    indicators: sector.indicators.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      link: i.link,
      seriesKey: i.seriesKey,
    })),
  };
  return NextResponse.json(detail);
}
