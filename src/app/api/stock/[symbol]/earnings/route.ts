import { FinnhubRateLimitError, getEarnings } from '@/lib/api/finnhub';
import type { EarningsSurprise, EarningsSurprisePoint } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 최근 분기별 예상 vs 실제 EPS(서프라이즈). 실적은 분기당 1회라 길게 캐시(6h).
const cachedEarnings = unstable_cache(
  async (symbol: string): Promise<EarningsSurprise> => {
    const raw = await getEarnings(symbol);
    // Finnhub은 최신순 → 차트용으로 시간순(오래된→최신) 정렬.
    const points: EarningsSurprisePoint[] = [...raw]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((r) => {
        const beat =
          r.actual != null && r.estimate != null
            ? r.actual >= r.estimate
            : null;
        return {
          period: r.period,
          label: `${r.year % 100} Q${r.quarter}`,
          estimate: r.estimate,
          actual: r.actual,
          surprisePercent: r.surprisePercent,
          beat,
        };
      });
    const comparable = points.filter((p) => p.beat != null);
    return {
      points,
      beatCount: comparable.filter((p) => p.beat).length,
      total: comparable.length,
    };
  },
  ['stock-earnings'],
  { revalidate: 21600, tags: ['stock-earnings'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  try {
    const earnings = await cachedEarnings(sym);
    return NextResponse.json(earnings);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_EARNINGS] failed:', sym, e);
    const message = e instanceof Error ? e.message : '실적 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
