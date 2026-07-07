import { api } from '@/lib/api/axios';
import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 수동 조정 성장률(%). null이면 조정 해제(자동성장률 사용). -100~1000% 사이로 제한.
const bodySchema = z.object({
  growthOverride: z.number().min(-100).max(1000).nullable(),
});

// 적정주가 공식의 단일 소스는 gemini-server `src/lib/valuation.ts`다. 아래 클램프 범위는
// 거기 FAIR_PE_MIN/MAX와 항상 일치시킬 것. 목표 PEG는 하드코딩하지 않고 종목 행에 저장된
// targetPeg(마지막 스냅샷이 쓴 값)를 재사용해 드리프트를 줄인다.
const FAIR_PE_MIN = 5;
const FAIR_PE_MAX = 60;
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

// 조정 성장률만으로 적정주가/상승여력을 로컬 재계산. price·forwardPe는 이미 DB에 있으므로
// 외부(Finnhub) 재호출이 필요 없다. MANUAL 성장률은 자동성장률 캡(GROWTH_CAP)을 적용하지 않는다.
function recomputeFromOverride(
  price: number,
  forwardPe: number | null,
  targetPeg: number,
  growthOverride: number,
) {
  if (forwardPe == null || forwardPe === 0) {
    // forward P/E가 없으면(적자/NM) 적정주가 산출 불가 — gemini의 NO_DATA 분기와 동일.
    return { fairPe: null, fairValue: null, upsidePct: null, status: 'NO_EARNINGS' };
  }
  const fairPe = clamp(growthOverride * targetPeg, FAIR_PE_MIN, FAIR_PE_MAX);
  const fairValue = price * (fairPe / forwardPe);
  const upsidePct = ((fairValue - price) / price) * 100;
  return { fairPe, fairValue, upsidePct, status: 'OK' };
}

// PATCH /api/admin/valuation/[symbol] — 수동 조정 성장률 설정/해제(ADMIN).
// 설정: 저장된 price·forwardPe로 적정주가를 로컬 재계산(외부 호출 없음 → 실패 지점 없음).
// 해제: 자동 성장률(원시 EPS)이 DB에 없으므로 gemini 재스냅샷으로 복원(best-effort).
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

  // 스냅샷이 있어야 조정 가능(price·forwardPe·targetPeg를 여기서 읽어 재계산).
  const row = await prisma.stockValuation.findUnique({ where: { symbol } });
  if (!row) {
    return NextResponse.json(
      { message: '스냅샷이 없는 종목입니다. 먼저 배치로 스냅샷한 뒤 조정하세요.' },
      { status: 404 },
    );
  }

  // 조정 설정 — 외부 호출 없이 그 자리에서 재계산해 저장한다.
  if (growthOverride != null) {
    const { fairPe, fairValue, upsidePct, status } = recomputeFromOverride(
      row.price,
      row.forwardPe,
      row.targetPeg,
      growthOverride,
    );
    await prisma.stockValuation.update({
      where: { symbol },
      data: {
        growthOverride,
        growthPct: growthOverride,
        growthSource: 'MANUAL',
        fairPe,
        fairValue,
        upsidePct,
        prevUpsidePct: row.upsidePct, // −→+ 전환 감지용으로 직전값 보존
        status,
      },
    });
    return NextResponse.json({ symbol, growthOverride, fairValue, upsidePct });
  }

  // 조정 해제 — 원시 성장률이 DB에 없으므로 재스냅샷이 필요.
  // override만 먼저 지워 저장을 확정하고, 재스냅샷은 실패해도 저장에 영향 없게 흡수(다음 배치가 반영).
  await prisma.stockValuation.update({
    where: { symbol },
    data: { growthOverride: null },
  });
  try {
    await api.post(
      `${process.env.NEXT_PUBLIC_GEMINI_SERVER}/stocks-valuation-sync`,
      { symbols: [symbol] },
      { timeout: 20000 },
    );
  } catch (e) {
    console.error(
      '[VALUATION_OVERRIDE] resnapshot on clear failed:',
      e instanceof Error ? e.message : e,
    );
  }

  return NextResponse.json({ symbol, growthOverride: null });
}
