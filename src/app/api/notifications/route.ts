import { requireUser } from '@/lib/auth/guards';
import { paginatedResponse, readPagination } from '@/lib/api/pagination';
import prisma from '@/lib/prisma';
import type { NotificationItem } from '@/types/notification';
import type { Notification } from '@/generated/prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

function toItem(n: Notification): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkPath: n.linkPath,
    data: n.data,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  };
}

// GET /api/notifications?page=&size= — 내 알림 목록(최신순). 페이지네이션.
export async function GET(req: NextRequest) {
  const g = await requireUser();
  if (!g.ok) return g.res;

  const pagination = readPagination(req.nextUrl.searchParams, {
    defaultSize: 20,
  });
  const where = { userId: g.userId };

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(pagination
        ? { skip: (pagination.page - 1) * pagination.size, take: pagination.size }
        : {}),
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json(
    paginatedResponse(rows.map(toItem), total, pagination),
  );
}
