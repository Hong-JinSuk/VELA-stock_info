import { TICKER_KR } from '@/constants/stock-korean-names';
import prisma from '@/lib/prisma';
import type { StockReportItem } from '@/types/stocks-report';

// 심볼 목록 → 적정주가 보고서 행. StockValuation(서버 스냅샷)과 StockSymbol(영문명)을 join하고
// 표시명을 보강(TICKER_KR → label → 영문명 → symbol). 스냅샷 없으면 status='PENDING'.
// 산정방식(forwardPe·growthPct 등)은 응답에 싣지 않는다(비공개).
// 종목 보고서(/api/stocks-report)와 섹터 분석 상세가 공유.
export async function loadValuations(
  entries: { symbol: string; label?: string | null }[],
): Promise<StockReportItem[]> {
  if (entries.length === 0) return [];
  const symbols = entries.map((e) => e.symbol);

  const [valuations, stockRows] = await Promise.all([
    prisma.stockValuation.findMany({ where: { symbol: { in: symbols } } }),
    prisma.stockSymbol.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, description: true, type: true },
    }),
  ]);
  const valBySymbol = new Map(valuations.map((v) => [v.symbol, v]));
  const descBySymbol = new Map(stockRows.map((s) => [s.symbol, s.description]));
  // ETF/펀드(ETP)는 적정주가 개념이 없어 화면에서 "—"로 구분 표시한다.
  const typeBySymbol = new Map(stockRows.map((s) => [s.symbol, s.type]));

  return entries.map(({ symbol, label }): StockReportItem => {
    const name =
      TICKER_KR[symbol] ?? label ?? descBySymbol.get(symbol) ?? symbol;
    const isEtf = typeBySymbol.get(symbol) === 'ETP';
    const v = valBySymbol.get(symbol);
    if (!v) {
      return {
        symbol,
        name,
        isEtf,
        status: 'PENDING',
        price: null,
        roaTtm: null,
        fairValue: null,
        upsidePct: null,
        high52w: null,
        growthPct: null,
        growthSource: null,
        snapshotAt: null,
      };
    }
    return {
      symbol,
      name,
      isEtf,
      status: v.status as StockReportItem['status'],
      price: v.price,
      roaTtm: v.roaTtm,
      fairValue: v.fairValue,
      upsidePct: v.upsidePct,
      high52w: v.high52w,
      growthPct: v.growthPct,
      growthSource: v.growthSource,
      snapshotAt: v.snapshotAt.toISOString(),
    };
  });
}
