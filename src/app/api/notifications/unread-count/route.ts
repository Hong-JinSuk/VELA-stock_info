import { requireUser } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/notifications/unread-count — 내 안 읽음 알림 수. 벨 배지 폴링용. bare { count }.
export async function GET() {
  const g = await requireUser();
  if (!g.ok) return g.res;

  const count = await prisma.notification.count({
    where: { userId: g.userId, readAt: null },
  });
  return NextResponse.json({ count });
}
