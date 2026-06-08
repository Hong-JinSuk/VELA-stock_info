import {
  FinnhubRateLimitError,
  getInsiderTransactions,
} from '@/lib/api/finnhub';
import { analyzeInsiderTransactions } from '@/lib/stock/insider-analysis';
import type { InsiderAnalysis } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 최근 12개월 내부자 거래 → 월별 매수/매도 + 유형별 버킷 분석. 1시간 캐시.
const cachedInsider = unstable_cache(
  async (symbol: string): Promise<InsiderAnalysis> => {
    const to = new Date();
    const from = new Date(
      Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), 1),
    );
    const txs = await getInsiderTransactions(symbol, ymd(from), ymd(to));
    return analyzeInsiderTransactions(txs, to);
  },
  ['stock-insider'],
  { revalidate: 3600, tags: ['stock-insider'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  try {
    const analysis = await cachedInsider(sym);
    return NextResponse.json(analysis);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_INSIDER] failed:', sym, e);
    const message = e instanceof Error ? e.message : '내부자 거래 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
