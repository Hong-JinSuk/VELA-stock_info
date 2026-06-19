import { api } from '@/lib/api/axios';
import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 수동 조정 성장률(%). null이면 조정 해제(자동성장률 사용). -100~1000% 사이로 제한.
const bodySchema = z.object({
  growthOverride: z.number().min(-100).max(1000).nullable(),
});

// PATCH /api/admin/valuation/[symbol] — 수동 조정 성장률 설정/해제(ADMIN).
// StockValuation.growthOverride만 갱신하고, 해당 종목을 즉시 재스냅샷해 적정주가에 반영한다.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: '조정 성장률 값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { growthOverride } = parsed.data;

  // 스냅샷이 있어야 조정 가능(컬럼이 StockValuation에 있음).
  const updated = await prisma.stockValuation.updateMany({
    where: { symbol },
    data: { growthOverride },
  });
  if (updated.count === 0) {
    return NextResponse.json(
      { message: '스냅샷이 없는 종목입니다. 먼저 배치로 스냅샷한 뒤 조정하세요.' },
      { status: 404 },
    );
  }

  // 조정값을 반영해 즉시 재스냅샷(실패해도 저장 자체는 성공으로 둔다 — 다음 배치가 반영).
  try {
    await api.post(
      `${process.env.NEXT_PUBLIC_GEMINI_SERVER}/stocks-valuation-sync`,
      { symbols: [symbol] },
      { timeout: 20000 },
    );
  } catch (e) {
    console.error(
      '[VALUATION_OVERRIDE] resnapshot failed:',
      e instanceof Error ? e.message : e,
    );
  }

  return NextResponse.json({ symbol, growthOverride });
}
