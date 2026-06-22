import { requireUser } from '@/lib/auth/guards';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST /api/notifications/read-all — 내 안 읽음 알림 전부 읽음 처리.
export async function POST() {
  const g = await requireUser();
  if (!g.ok) return g.res;

  const result = await prisma.notification.updateMany({
    where: { userId: g.userId, readAt: null },
    data: { readAt: kstNow() },
  });
  return NextResponse.json({ updated: result.count });
}
