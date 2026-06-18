import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { updateSectorSchema } from '@/schemas/analysis-sector-schema';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/admin/analysis/sectors/[id] — 섹터 수정. ADMIN 전용.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id } = await params;
  const parsed = updateSectorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const updated = await prisma.analysisSector.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/admin/analysis/sectors/[id] — 섹터 삭제(아이템 cascade). ADMIN 전용.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id } = await params;
  await prisma.analysisSector.delete({ where: { id } });
  return NextResponse.json({ id });
}
