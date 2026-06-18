import { requireAdmin } from '@/lib/auth/guards';
import { getMenuTree } from '@/lib/menu/get-menu-tree';
import prisma from '@/lib/prisma';
import { createMenuSchema } from '@/schemas/menu-schema';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// path 기반 key slug 생성. 충돌 시 짧은 랜덤 접미사.
async function generateKey(path: string): Promise<string> {
  const base =
    path
      .replace(/^\/+/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'menu';
  const exists = await prisma.menu.findUnique({ where: { key: base } });
  if (!exists) return base;
  return `${base}-${randomUUID().slice(0, 6)}`;
}

// GET /api/admin/menus — 전체 메뉴 트리. ADMIN 전용.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.res;
  const tree = await getMenuTree();
  return NextResponse.json(tree);
}

// POST /api/admin/menus — 메뉴 생성. ADMIN 전용. parentId 없으면 대분류.
export async function POST(req: NextRequest) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const parsed = createMenuSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { parentId, sortOrder, ...rest } = parsed.data;

  // 2단 구조 유지: parentId가 가리키는 메뉴는 FOLDER 대분류(parentId=null)여야 한다.
  if (parentId) {
    const parent = await prisma.menu.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, type: true },
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
        { message: '하위 메뉴는 FOLDER 타입 아래에만 추가할 수 있습니다.' },
        { status: 400 },
      );
    }
  }

  // sortOrder 미지정 시 같은 부모의 맨 뒤로.
  let order = sortOrder;
  if (order === undefined) {
    const last = await prisma.menu.aggregate({
      where: { parentId: parentId ?? null },
      _max: { sortOrder: true },
    });
    order = (last._max.sortOrder ?? -1) + 1;
  }

  const key = await generateKey(rest.path);
  const created = await prisma.menu.create({
    data: {
      key,
      parentId: parentId ?? null,
      title: rest.title,
      path: rest.path,
      icon: rest.icon ?? null,
      badge: rest.badge ?? null,
      type: rest.type ?? 'LINK',
      disabled: rest.disabled ?? false,
      minRole: rest.minRole ?? 'FREE',
      hidden: rest.hidden ?? false,
      locked: rest.locked ?? false,
      sortOrder: order,
    },
  });
  return NextResponse.json(created);
}
