import { api } from '@/lib/api/axios';
import { requireAdmin } from '@/lib/auth/guards';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 적정주가 조정 페이지의 "섹터 미지정" 관리 대상(ValuationWatch)에 종목 추가(ADMIN).
// symbol은 StockSymbol에 존재해야 함(폴리모픽 관례: FK 대신 앱 검증). ETF는 적정주가 산출 대상이 아님.
const bodySchema = z.object({
  symbol: z.string().trim().min(1).max(12),
});

export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const symbol = parsed.data.symbol.toUpperCase();

  const stock = await prisma.stockSymbol.findUnique({
    where: { symbol },
    select: { symbol: true, type: true },
  });
  if (!stock) {
    return NextResponse.json(
      { message: '존재하지 않는 종목입니다.' },
      { status: 404 },
    );
  }
  if (stock.type === 'ETP') {
    return NextResponse.json(
      { message: 'ETF는 적정주가 산출 대상이 아닙니다.' },
      { status: 400 },
    );
  }

  const dup = await prisma.valuationWatch.findUnique({
    where: { symbol },
    select: { symbol: true },
  });
  if (dup) {
    return NextResponse.json(
      { message: '이미 등록된 종목입니다.' },
      { status: 409 },
    );
  }

  const now = kstNow();
  await prisma.valuationWatch.create({
    data: { symbol, createdAt: now, updatedAt: now },
  });

  // 신규 종목 우선: cron을 기다리지 않고 곧바로 적정주가 스냅샷(개별 종목만).
  // 실패해도 등록 자체는 성공으로 둔다(다음 배치가 채움; 그동안 화면엔 PENDING으로 표시됨).
  try {
    await api.post(
      `${process.env.NEXT_PUBLIC_GEMINI_SERVER}/stocks-valuation-sync`,
      { symbols: [symbol] },
      { timeout: 20000 },
    );
  } catch (e) {
    console.error(
      '[VALUATION_WATCH] immediate valuation failed:',
      e instanceof Error ? e.message : e,
    );
  }

  return NextResponse.json({ symbol }, { status: 201 });
}
