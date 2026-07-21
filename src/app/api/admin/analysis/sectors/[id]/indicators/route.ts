import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import {
  addSectorIndicatorSchema,
  updateSectorIndicatorSchema,
} from '@/schemas/analysis-sector-schema';
import { NextRequest, NextResponse } from 'next/server';

// 섹터별 "중요 지표" 큐레이션 CRUD (ADMIN 전용). AnalysisSectorItem 라우트와 동일 패턴이나
// 종목이 아닌 자유 지표(이름 + 왜 중요 + 선택 링크)라 심볼 검증 없이 id를 키로 다룬다.

// POST /api/admin/analysis/sectors/[id]/indicators — 지표 추가.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id: sectorId } = await params;
  const parsed = addSectorIndicatorSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const name = parsed.data.name.trim();
  const description = parsed.data.description.trim();
  const link = parsed.data.link?.trim() || null;
  const seriesKey = parsed.data.seriesKey?.trim() || null;

  const sector = await prisma.analysisSector.findUnique({
    where: { id: sectorId },
    select: { id: true },
  });
  if (!sector) {
    return NextResponse.json(
      { message: '섹터를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  const count = await prisma.analysisSectorIndicator.count({
    where: { sectorId },
  });
  const ind = await prisma.analysisSectorIndicator.create({
    data: { sectorId, name, description, link, seriesKey, sortOrder: count },
  });
  return NextResponse.json(
    {
      id: ind.id,
      name: ind.name,
      description: ind.description,
      link: ind.link,
      seriesKey: ind.seriesKey,
      sortOrder: ind.sortOrder,
    },
    { status: 201 },
  );
}

// PATCH /api/admin/analysis/sectors/[id]/indicators — 지표 수정(body.id로 대상 지정).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id: sectorId } = await params;
  const parsed = updateSectorIndicatorSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { id, name, description, link, seriesKey } = parsed.data;

  const res = await prisma.analysisSectorIndicator.updateMany({
    where: { id, sectorId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(link !== undefined ? { link: link?.trim() || null } : {}),
      ...(seriesKey !== undefined
        ? { seriesKey: seriesKey?.trim() || null }
        : {}),
    },
  });
  if (res.count === 0) {
    return NextResponse.json(
      { message: '지표를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ id });
}

// DELETE /api/admin/analysis/sectors/[id]/indicators?indicatorId=... — 지표 제거.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id: sectorId } = await params;
  const indicatorId = req.nextUrl.searchParams.get('indicatorId');
  if (!indicatorId) {
    return NextResponse.json(
      { message: 'indicatorId가 필요합니다.' },
      { status: 400 },
    );
  }

  await prisma.analysisSectorIndicator.deleteMany({
    where: { id: indicatorId, sectorId },
  });
  return NextResponse.json({ id: indicatorId });
}
