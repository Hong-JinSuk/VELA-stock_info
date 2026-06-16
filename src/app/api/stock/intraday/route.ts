import { getIntraday } from '@/lib/api/yahoo';
import type { StockIntradayPoint } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 즐겨찾기 목록의 1일 미니 차트용 — 여러 종목의 인트라데이를 한 번에 반환.
// Yahoo는 비공식 엔드포인트라 한 번에 많이 때리면 일시 차단될 수 있어,
// 서버에서 동시성 제한 + 종목당 60초 캐시 + 실패 흡수로 부담을 줄인다.
const MAX_SYMBOLS = 120;
const CONCURRENCY = 5;

export type StockIntradayResult = {
  symbol: string;
  points: StockIntradayPoint[];
};

// 종목당 60초 캐시 (인트라데이 변동 반영하되 Yahoo 호출 최소화).
const cachedIntraday = unstable_cache(
  async (symbol: string): Promise<StockIntradayPoint[]> => getIntraday(symbol),
  ['stock-intraday'],
  { revalidate: 60, tags: ['stock-intraday'] },
);

// 동시성 제한 풀 — 한 번에 CONCURRENCY개씩만 Yahoo에 요청.
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('symbols') ?? '';
  const symbols = Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return NextResponse.json([] satisfies StockIntradayResult[]);
  }

  const results = await mapWithLimit(
    symbols,
    CONCURRENCY,
    async (symbol): Promise<StockIntradayResult> => ({
      symbol,
      points: await cachedIntraday(symbol), // getIntraday가 실패 시 [] 반환(best-effort)
    }),
  );

  return NextResponse.json(results);
}
