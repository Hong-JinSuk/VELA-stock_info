import { TICKER_KR } from '@/constants/stock-korean-names';
import { Prisma } from '@/generated/prisma/client';
import { FinnhubRateLimitError, getQuote } from '@/lib/api/finnhub';
import { prisma } from '@/lib/prisma';
import type { StockQuote, StockQuoteItem } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 즐겨찾기 등 다건 종목의 요약 시세(이름 + 현재가 + 등락)를 한 번에 반환.
// 상세(StockDetail)는 종목당 호출이 무거워서, 여기선 quote만 가볍게 배치 조회한다.
const MAX_SYMBOLS = 100;

// 시세는 종목당 60초 캐시 (intraday 반영 + Finnhub rate-limit 보호).
const cachedQuote = unstable_cache(
  async (symbol: string): Promise<StockQuote> => getQuote(symbol),
  ['stock-quote'],
  { revalidate: 60, tags: ['stock-quote'] },
);

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
    return NextResponse.json([] satisfies StockQuoteItem[]);
  }

  try {
    // 이름은 StockSymbol DB 한 방 쿼리로 (종목당 profile 호출 회피). 한국어명 우선.
    const rows = await prisma.$queryRaw<
      Array<{ symbol: string; description: string; currency: string | null }>
    >(Prisma.sql`
      SELECT symbol, description, currency
      FROM "StockSymbol"
      WHERE symbol IN (${Prisma.join(symbols)})
    `);
    const meta = new Map(rows.map((r) => [r.symbol, r]));

    const items = await Promise.all(
      symbols.map(async (symbol): Promise<StockQuoteItem> => {
        const m = meta.get(symbol);
        const name = TICKER_KR[symbol] ?? m?.description ?? symbol;
        const currency = m?.currency ?? 'USD';
        try {
          const q = await cachedQuote(symbol);
          return {
            symbol,
            name,
            currency,
            current: q.current,
            change: q.change,
            percentChange: q.percentChange,
          };
        } catch (e) {
          if (e instanceof FinnhubRateLimitError) throw e;
          // 개별 종목 실패는 0으로 흡수 (목록 전체를 죽이지 않음).
          return { symbol, name, currency, current: 0, change: 0, percentChange: 0 };
        }
      }),
    );

    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_QUOTES] failed:', symbols, e);
    const message = e instanceof Error ? e.message : '시세 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
