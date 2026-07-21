import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { createSectorSchema } from '@/schemas/analysis-sector-schema';
import type { AdminSector } from '@/types/analysis';
import { NextRequest, NextResponse } from 'next/server';

function toAdminSector(s: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: { id: string; symbol: string; note: string | null; sortOrder: number }[];
  indicators: {
    id: string;
    name: string;
    description: string;
    link: string | null;
    seriesKey: string | null;
    sortOrder: number;
  }[];
}): AdminSector {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    sortOrder: s.sortOrder,
    items: s.items.map((i) => ({
      id: i.id,
      symbol: i.symbol,
      note: i.note,
      sortOrder: i.sortOrder,
    })),
    indicators: s.indicators.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      link: i.link,
      seriesKey: i.seriesKey,
      sortOrder: i.sortOrder,
    })),
  };
}

// GET /api/admin/analysis/sectors — 전체 섹터 + 아이템 (관리용). ADMIN 전용.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const sectors = await prisma.analysisSector.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      items: { orderBy: [{ sortOrder: 'asc' }] },
      indicators: { orderBy: [{ sortOrder: 'asc' }] },
    },
  });
  return NextResponse.json(sectors.map(toAdminSector));
}

// POST /api/admin/analysis/sectors — 섹터 생성. ADMIN 전용.
export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const parsed = createSectorSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { slug, name, description } = parsed.data;

  const exists = await prisma.analysisSector.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json(
      { message: '이미 존재하는 slug입니다.' },
      { status: 409 },
    );
  }

  const created = await prisma.analysisSector.create({
    data: { slug, name, description: description ?? null },
    include: { items: true, indicators: true },
  });
  return NextResponse.json(toAdminSector(created), { status: 201 });
}
