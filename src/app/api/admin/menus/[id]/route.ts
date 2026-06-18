import { requireAdmin } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { updateMenuSchema } from '@/schemas/menu-schema';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/admin/menus/[id] — 메뉴 속성/순서 변경. ADMIN 전용.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id } = await params;
  const parsed = updateMenuSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { message: '메뉴를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  const data = parsed.data;

  // 잠금 보호: locked 메뉴는 "잠금 해제(locked:false)"만 허용, 그 외 변경은 차단.
  const onlyUnlocking =
    Object.keys(data).length === 1 && data.locked === false;
  if (existing.locked && !onlyUnlocking) {
    return NextResponse.json(
      { message: '고정된 메뉴입니다. 먼저 잠금을 해제하세요.' },
      { status: 423 },
    );
  }

  // parentId 변경 시 2단 구조 유지 + 자기참조/순환 방지.
  if (data.parentId !== undefined && data.parentId) {
    if (data.parentId === id) {
      return NextResponse.json(
        { message: '자기 자신을 상위로 지정할 수 없습니다.' },
        { status: 400 },
      );
    }
    const parent = await prisma.menu.findUnique({
      where: { id: data.parentId },
      select: { parentId: true, type: true },
    });
    if (!parent) {
      return NextResponse.json(
        { message: '상위 메뉴를 찾을 수 없습니다.' },
        { status: 400 },
      );
    }
    if (parent.parentId) {
      return NextResponse.json(
        { message: '메뉴는 2단까지만 지원합니다.' },
        { status: 400 },
      );
    }
    if (parent.type !== 'FOLDER') {
      return NextResponse.json(
        { message: '하위 메뉴는 FOLDER 타입 아래에만 둘 수 있습니다.' },
        { status: 400 },
      );
    }
    // 하위를 가진 대분류를 다른 메뉴 아래로 옮기면 3단이 되므로 막는다.
    const childCount = await prisma.menu.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { message: '하위 메뉴가 있는 대분류는 다른 메뉴 아래로 옮길 수 없습니다.' },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.menu.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.path !== undefined ? { path: data.path } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.badge !== undefined ? { badge: data.badge } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.disabled !== undefined ? { disabled: data.disabled } : {}),
      ...(data.minRole !== undefined ? { minRole: data.minRole } : {}),
      ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
      ...(data.locked !== undefined ? { locked: data.locked } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
  return NextResponse.json(updated);
}

// DELETE /api/admin/menus/[id] — 메뉴 삭제(대분류면 하위도 cascade). ADMIN 전용.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const { id } = await params;
  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { message: '메뉴를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }
  if (existing.locked) {
    return NextResponse.json(
      { message: '고정된 메뉴입니다. 먼저 잠금을 해제하세요.' },
      { status: 423 },
    );
  }

  await prisma.menu.delete({ where: { id } });
  return NextResponse.json({ id });
}
