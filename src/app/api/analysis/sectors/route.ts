import { assertRouteAccess } from '@/lib/auth/route-access';
import prisma from '@/lib/prisma';
import type { AnalysisSectorListItem } from '@/types/analysis';
import { NextResponse } from 'next/server';

// GET /api/analysis/sectors — 섹터 목록(조회). 접근권한은 RouteAccess('analysis-sectors').
// bounded 목록이라 bare array.
export async function GET() {
  const denied = await assertRouteAccess('analysis-sectors');
  if (denied) return denied;

  const sectors = await prisma.analysisSector.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { items: true } },
    },
  });

  const items: AnalysisSectorListItem[] = sectors.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    itemCount: s._count.items,
  }));
  return NextResponse.json(items);
}
