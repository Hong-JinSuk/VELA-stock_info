import { TICKER_KR } from '@/constants/stock-korean-names';
import { Prisma } from '@/generated/prisma/client';
import { FinnhubRateLimitError, searchSymbol } from '@/lib/api/finnhub';
import { prisma } from '@/lib/prisma';
import type { StockSearchItem } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// 종목 검색. 우리 StockSymbol 테이블(미국 전체 ~27k, gemini-server cron이 주 1회 갱신)을
// 조회 → Finnhub /search 콜 0. DB 미스(주로 동기화 주기 사이 신규 상장)일 때만 Finnhub fallback.
const RESULT_LIMIT = 15;

// 인기 종목(한국어명 큐레이션 = 사실상 대형주 목록). 검색 랭킹 부스트에 재사용.
// 시총 신호가 없어 "appl→APPLE"처럼 알파벳순에 밀리는 걸 보정(예: APPLF보다 AAPL 위로).
const POPULAR = Object.keys(TICKER_KR);

type Row = {
  symbol: string;
  displaySymbol: string | null;
  description: string;
  type: string;
};

// DB 검색 + 랭킹. ORDER BY 우선순위:
//   1) 매치 품질: 심볼 정확일치(0) > 심볼/회사명 prefix(1) > 회사명 부분일치(2)
//   2) 인기 종목(대형주) 우선 — 동일 매치 티어에서 AAPL/BRK.B 등을 위로
//   3) 보통주 우선 + 미국 상장(접미사 점 없음) 우선
//   4) 짧은 심볼·알파벳 순
async function searchDb(q: string): Promise<StockSearchItem[]> {
  const upper = q.toUpperCase();
  const prefix = `${upper}%`;
  const descPrefix = `${q}%`;
  const contains = `%${q}%`;
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT symbol, "displaySymbol", description, type
    FROM "StockSymbol"
    WHERE symbol ILIKE ${prefix} OR description ILIKE ${contains}
    ORDER BY
      (CASE
        WHEN symbol = ${upper} THEN 0
        WHEN symbol ILIKE ${prefix} OR description ILIKE ${descPrefix} THEN 1
        ELSE 2
      END) ASC,
      (CASE WHEN symbol IN (${Prisma.join(POPULAR)}) THEN 0 ELSE 1 END) ASC,
      (CASE WHEN type = 'Common Stock' THEN 0 ELSE 1 END
        + CASE WHEN symbol LIKE '%.%' THEN 1 ELSE 0 END) ASC,
      length(symbol) ASC,
      symbol ASC
    LIMIT ${RESULT_LIMIT}
  `);
  return rows.map((r) => ({
    symbol: r.symbol,
    displaySymbol: r.displaySymbol ?? r.symbol,
    description: r.description,
    type: r.type,
    inDirectory: true, // DB 결과는 항상 디렉터리에 존재
  }));
}

// 검색어별 1시간 캐시. DB가 비면(신규 상장 등) 그때만 Finnhub /search 1콜.
// 폴백 결과는 각 심볼의 실제 DB 존재 여부로 inDirectory를 채운다(추가 가능 여부 표시용).
const cachedSearch = unstable_cache(
  async (q: string): Promise<StockSearchItem[]> => {
    const dbResults = await searchDb(q);
    if (dbResults.length > 0) return dbResults;

    const fallback = await searchSymbol(q);
    if (fallback.length === 0) return fallback;
    const existing = await prisma.stockSymbol.findMany({
      where: { symbol: { in: fallback.map((f) => f.symbol) } },
      select: { symbol: true },
    });
    const inDir = new Set(existing.map((e) => e.symbol));
    return fallback.map((f) => ({ ...f, inDirectory: inDir.has(f.symbol) }));
  },
  ['stock-search'],
  { revalidate: 3600, tags: ['stock-search'] },
);

export async function GET(req: NextRequest) {
  const searchKey = (req.nextUrl.searchParams.get('searchKey') ?? '').trim();
  if (!searchKey) return NextResponse.json([]);
  try {
    const items = await cachedSearch(searchKey);
    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_SEARCH] failed:', e);
    const message = e instanceof Error ? e.message : '검색 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
