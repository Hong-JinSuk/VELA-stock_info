import { api } from '@/lib/api/axios';
import type { MenuNode } from '@/types/menu';
import { useQuery } from '@tanstack/react-query';

// 사이드바 메뉴 트리. 자주 안 바뀌므로 길게 캐시.
async function fetchMenus(): Promise<MenuNode[]> {
  const { data } = await api.get<MenuNode[]>('/menus');
  return data;
}

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    staleTime: 1000 * 60 * 10,
  });
}
