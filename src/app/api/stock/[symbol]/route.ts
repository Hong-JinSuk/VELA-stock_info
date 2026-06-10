import { TICKER_KR } from '@/constants/stock-korean-names';
import { Prisma } from '@/generated/prisma/client';
import {
  FinnhubRateLimitError,
  getMetrics,
  getProfile,
  getQuote,
  getRecommendation,
} from '@/lib/api/finnhub';
import { getPriceTarget } from '@/lib/api/yahoo';
import { prisma } from '@/lib/prisma';
import type { StockDetail, StockProfile } from '@/types/stock';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 주요 MIC 코드 → 거래소 라벨 (ETF fallback 프로필 표시용).
const MIC_LABELS: Record<string, string> = {
  XNAS: 'NASDAQ',
  XNYS: 'NYSE',
  ARCX: 'NYSE Arca',
  BATS: 'Cboe BZX',
  XASE: 'NYSE American',
  OOTC: 'OTC', // 장외(미국 OTC ADR 등)
};

// ETF/펀드 등 Finnhub 회사 프로필(profile2)이 비는 종목은 우리 StockSymbol로 fallback.
// 한국어명이 있으면 그걸 표시명으로(예: "테슬라 2배 ETF"), 없으면 영문 description.
async function fundProfileFallback(
  symbol: string,
): Promise<StockProfile | null> {
  const rows = await prisma.$queryRaw<
    Array<{ description: string; type: string; currency: string | null; mic: string | null }>
  >(Prisma.sql`
    SELECT description, type, currency, mic FROM "StockSymbol" WHERE symbol = ${symbol} LIMIT 1
  `);
  const row = rows[0];
  if (!row) return null;
  return {
    name: TICKER_KR[symbol] ?? row.description,
    ticker: symbol,
    exchange: (row.mic && MIC_LABELS[row.mic]) || row.mic || '',
    industry: row.type === 'ETP' ? 'ETF·펀드' : row.type,
    logo: '',
    weburl: '',
    currency: row.currency ?? 'USD',
    marketCap: null,
    country: 'US',
    isFund: true,
  };
}

// 외국기업 ADR(TSM·BABA 등)은 Finnhub profile2가 본토 거래소·통화(TAIWAN/TWD)로 주지만,
// 실제 시세(quote)는 미국 ADR(USD) 가격이다 → "USD 가격에 TWD 라벨" 불일치가 생긴다.
// 우리 StockSymbol DB에 있는 심볼이면 미국 상장 메타(거래소·통화)로 교정한다.
// (DB에 없는 심볼 = 해외 직접조회 등은 Finnhub 원본 유지.)
async function withUsListingMeta(
  symbol: string,
  profile: StockProfile,
): Promise<StockProfile> {
  const rows = await prisma.$queryRaw<
    Array<{ currency: string | null; mic: string | null }>
  >(Prisma.sql`
    SELECT currency, mic FROM "StockSymbol" WHERE symbol = ${symbol} LIMIT 1
  `);
  const row = rows[0];
  if (!row) return profile;
  return {
    ...profile,
    // ticker도 본토 심볼(7203.T 등)로 오는 경우가 있어 검색한 미국 심볼로 교정.
    ticker: symbol,
    exchange: (row.mic && MIC_LABELS[row.mic]) || row.mic || profile.exchange,
    currency: row.currency ?? profile.currency,
  };
}

// 종목 기본정보: 프로필 + 시세 + 주요지표 + 애널리스트 의견.
// 시세가 섞여 있어 60초 캐시 (intraday 변동 반영하되 rate-limit 보호).
const cachedDetail = unstable_cache(
  async (symbol: string): Promise<StockDetail | null> => {
    const [profile, quote, metrics, recommendation, priceTarget] =
      await Promise.all([
        getProfile(symbol),
        getQuote(symbol),
        getMetrics(symbol),
        getRecommendation(symbol),
        getPriceTarget(symbol), // best-effort: 실패/미제공 시 null
      ]);
    // 회사 프로필이 있으면 미국 상장 메타로 교정해 반환. 없지만 유효한 시세가 있으면(ETF 등) fallback.
    if (profile) {
      return {
        profile: await withUsListingMeta(symbol, profile),
        quote,
        metrics,
        recommendation,
        priceTarget,
      };
    }
    if (quote.current > 0) {
      const fund = await fundProfileFallback(symbol);
      if (fund)
        return { profile: fund, quote, metrics, recommendation, priceTarget };
    }
    return null;
  },
  ['stock-detail'],
  { revalidate: 60, tags: ['stock-detail'] },
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const sym = symbol.toUpperCase();
  try {
    const detail = await cachedDetail(sym);
    if (!detail) {
      return NextResponse.json(
        { message: '종목을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof FinnhubRateLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 });
    }
    console.error('[STOCK_DETAIL] failed:', sym, e);
    const message = e instanceof Error ? e.message : '종목 조회 실패';
    return NextResponse.json({ message }, { status: 500 });
  }
}
