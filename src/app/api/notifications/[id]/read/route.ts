import { requireUser } from '@/lib/auth/guards';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// PATCH /api/notifications/[id]/read — 단건 읽음 처리(본인 것만, 멱등).
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireUser();
  if (!g.ok) return g.res;

  const { id } = await params;
  // 본인 소유 + 아직 안 읽은 것만 갱신(updateMany로 소유권 필터 동시 적용).
  const result = await prisma.notification.updateMany({
    where: { id, userId: g.userId, readAt: null },
    data: { readAt: kstNow() },
  });
  return NextResponse.json({ id, updated: result.count });
}
