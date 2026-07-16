'use client';

import type { NavItemProps } from '@/app/(main)/types';
import { resolveMenuIcon } from '@/constants/menu-icons';
import type { MenuNode } from '@/types/menu';
import { useSession } from 'next-auth/react';
import { useMenus } from './use-menus';

// DB 메뉴 트리 → 사이드바 NavItemProps 트리.
// - hidden=true 메뉴는 제외(ADMIN은 전부 노출). minRole은 노출에 영향 없음(클릭 시 서버 가드).
// - icon 문자열 → 컴포넌트 해석. 자식이 전부 숨겨지면 부모도 숨김.
export function useNavMenus(): { items: NavItemProps[]; isLoading: boolean } {
  const { data: session } = useSession();
  const { data: tree, isLoading } = useMenus();
  const isAdmin = session?.user?.role === 'ADMIN';

  const visible = (m: MenuNode) => isAdmin || !m.hidden;

  const items = (tree ?? [])
    .filter(visible)
    .map((group): NavItemProps | null => {
      const base: NavItemProps = {
        title: group.title,
        url: group.path,
        icon: resolveMenuIcon(group.icon),
        disabled: group.disabled,
        popup: group.type === 'POPUP',
        badge: group.badge ?? undefined,
        beta: group.beta,
      };

      // FOLDER만 아코디언으로 자식을 펼친다. LINK/POPUP은 단일 항목.
      if (group.type === 'FOLDER') {
        const subs = group.children.filter(visible);
        if (subs.length === 0) return null; // 보일 자식이 없는 폴더는 숨김
        return {
          ...base,
          items: subs.map((c) => ({
            title: c.title,
            url: c.path,
            disabled: c.disabled,
            beta: c.beta,
            popup: c.type === 'POPUP',
            routeKey: c.key,
          })),
        };
      }
      return base;
    })
    .filter((x): x is NavItemProps => x !== null);

  return { items, isLoading };
}
