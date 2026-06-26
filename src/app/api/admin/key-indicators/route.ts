import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { addKeyIndicatorSchema } from '@/schemas/key-indicator-schema';
import type { KeyIndicatorRef } from '@/types/macro-indicator';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/key-indicators — 큐레이션된 중요 지표 목록 (sortOrder 오름차순). ADMIN 전용.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const rows = await prisma.keyIndicator.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { indicatorId: true, sortOrder: true },
  });
  return NextResponse.json(rows as KeyIndicatorRef[]);
}

// POST /api/admin/key-indicators — 중요 지표 추가. ADMIN 전용.
// indicatorId는 Indicator(catalog 스냅샷)에 존재해야 함.
export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const parsed = addKeyIndicatorSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { indicatorId } = parsed.data;

  const indicator = await prisma.indicator.findUnique({
    where: { id: indicatorId },
    select: { id: true },
  });
  if (!indicator) {
    return NextResponse.json(
      { message: '존재하지 않는 지표입니다.' },
      { status: 404 },
    );
  }

  const dup = await prisma.keyIndicator.findUnique({
    where: { indicatorId },
    select: { indicatorId: true },
  });
  if (dup) {
    return NextResponse.json(
      { message: '이미 중요 지표에 추가된 지표입니다.' },
      { status: 409 },
    );
  }

  const count = await prisma.keyIndicator.count();
  const created = await prisma.keyIndicator.create({
    data: { indicatorId, sortOrder: count },
    select: { indicatorId: true, sortOrder: true },
  });
  return NextResponse.json(created as KeyIndicatorRef, { status: 201 });
}

// DELETE /api/admin/key-indicators?indicatorId=ust_10y — 중요 지표 제거. ADMIN 전용.
export async function DELETE(req: NextRequest) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const indicatorId = req.nextUrl.searchParams.get('indicatorId');
  if (!indicatorId) {
    return NextResponse.json(
      { message: 'indicatorId가 필요합니다.' },
      { status: 400 },
    );
  }

  await prisma.keyIndicator.deleteMany({ where: { indicatorId } });
  return NextResponse.json({ indicatorId });
}
