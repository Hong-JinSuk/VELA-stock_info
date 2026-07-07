import { getProfile } from '@/lib/api/finnhub';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/stock/logos?symbols=NVDA,AVGO — 회사 로고 URL(bounded 목록이라 bare array).
// StockLogo DB 캐시를 읽고, 캐시에 없는 심볼만 Finnhub /profile2로 채운다(거의 불변 → 이후 0콜).
// Finnhub 실패 심볼은 logo=null(모노그램 폴백)로 두고 요청 전체는 성공으로 둔다.
const MAX_SYMBOLS = 60; // 섹터 한 개 분량이면 충분(과도한 Finnhub 호출 방지)

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
  ).slice(0, MAX_SYMBOLS);
  if (symbols.length === 0) return NextResponse.json([]);

  const cached = await prisma.stockLogo.findMany({
    where: { symbol: { in: symbols } },
  });
  const logoBySym = new Map(cached.map((c) => [c.symbol, c.logo]));

  const misses = symbols.filter((s) => !logoBySym.has(s));
  if (misses.length > 0) {
    const now = kstNow();
    await Promise.all(
      misses.map(async (symbol) => {
        // 로고 URL만 필요. 실패/미존재는 null로 캐시(재조회 방지).
        const profile = await getProfile(symbol).catch(() => null);
        const logo = profile?.logo ? profile.logo : null;
        await prisma.stockLogo
          .upsert({
            where: { symbol },
            create: { symbol, logo, updatedAt: now },
            update: { logo, updatedAt: now },
          })
          .catch(() => undefined);
        logoBySym.set(symbol, logo);
      }),
    );
  }

  const result = symbols.map((symbol) => ({
    symbol,
    logo: logoBySym.get(symbol) ?? null,
  }));
  return NextResponse.json(result);
}
