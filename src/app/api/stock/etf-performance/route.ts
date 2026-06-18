import { getDailyCloses } from '@/lib/api/yahoo';
import { computeReturns, TREND_POINTS } from '@/lib/market/period-returns';
import type { EtfPerformance } from '@/types/sector';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 섹터 분석 ETF 테이블용 기간 성과. /api/sectors와 동일 로직(getDailyCloses + computeReturns)을
// 임의 ETF 심볼에 적용. 심볼 세트별 10분 캐시. Yahoo 실패 심볼은 빈 성과로 둔다(best-effort).
const YAHOO_CHUNK_SIZE = 6;

const cachedEtfPerformance = unstable_cache(
  async (symbols: string[]): Promise<EtfPerformance[]> => {
    const out: EtfPerformance[] = [];
    for (let i = 0; i < symbols.length; i += YAHOO_CHUNK_SIZE) {
      const chunk = symbols.slice(i, i + YAHOO_CHUNK_SIZE);
      const series = await Promise.all(
        chunk.map((s) => getDailyCloses(s, '1y').catch(() => [])),
      );
      chunk.forEach((symbol, j) => {
        const closes = series[j];
        const last = closes[closes.length - 1];
        out.push({
          symbol,
          price: last?.close ?? null,
          returns: computeReturns(closes),
          trend: closes.slice(-TREND_POINTS).map((c) => c.close),
        });
      });
    }
    return out;
  },
  ['etf-performance'],
  { revalidate: 600, tags: ['etf-performance'] },
);

// GET /api/stock/etf-performance?symbols=NASA,UFO,ARKK
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('symbols') ?? '').trim();
  if (!raw) return NextResponse.json([]);
  const symbols = Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, 30);
  if (symbols.length === 0) return NextResponse.json([]);

  try {
    const items = await cachedEtfPerformance(symbols);
    return NextResponse.json(items);
  } catch (e) {
    console.error('[ETF_PERFORMANCE] failed:', e);
    const message = e instanceof Error ? e.message : 'ETF 성과 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
