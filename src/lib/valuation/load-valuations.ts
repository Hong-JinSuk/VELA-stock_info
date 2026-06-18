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
      select: { symbol: true, description: true },
    }),
  ]);
  const valBySymbol = new Map(valuations.map((v) => [v.symbol, v]));
  const descBySymbol = new Map(stockRows.map((s) => [s.symbol, s.description]));

  return entries.map(({ symbol, label }): StockReportItem => {
    const name =
      TICKER_KR[symbol] ?? label ?? descBySymbol.get(symbol) ?? symbol;
    const v = valBySymbol.get(symbol);
    if (!v) {
      return {
        symbol,
        name,
        status: 'PENDING',
        price: null,
        roaTtm: null,
        fairValue: null,
        upsidePct: null,
        snapshotAt: null,
      };
    }
    return {
      symbol,
      name,
      status: v.status as StockReportItem['status'],
      price: v.price,
      roaTtm: v.roaTtm,
      fairValue: v.fairValue,
      upsidePct: v.upsidePct,
      snapshotAt: v.snapshotAt.toISOString(),
    };
  });
}
