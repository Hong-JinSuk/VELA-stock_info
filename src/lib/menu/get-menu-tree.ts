import prisma from '@/lib/prisma';
import type { MenuNode, MenuType } from '@/types/menu';
import type { AccessLevel } from '@/types/user';
import { ensureMenusSeeded } from './menu-seed';

// 전체 메뉴를 트리(2단)로 빌드. 공개 GET / 관리 GET 공통.
// 빈 테이블이면 기본 시드를 먼저 채운다(안전망).
export async function getMenuTree(): Promise<MenuNode[]> {
  await ensureMenusSeeded();

  const rows = await prisma.menu.findMany({ orderBy: { sortOrder: 'asc' } });

  const nodes = new Map<string, MenuNode>();
  for (const r of rows) {
    nodes.set(r.id, {
      id: r.id,
      key: r.key,
      parentId: r.parentId,
      title: r.title,
      path: r.path,
      icon: r.icon,
      badge: r.badge,
      type: r.type as MenuType,
      disabled: r.disabled,
      minRole: r.minRole as AccessLevel,
      hidden: r.hidden,
      beta: r.beta,
      locked: r.locked,
      sortOrder: r.sortOrder,
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  for (const r of rows) {
    const node = nodes.get(r.id)!;
    const parent = r.parentId ? nodes.get(r.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const bySortOrder = (a: MenuNode, b: MenuNode) => a.sortOrder - b.sortOrder;
  roots.sort(bySortOrder);
  for (const node of nodes.values()) node.children.sort(bySortOrder);

  return roots;
}
