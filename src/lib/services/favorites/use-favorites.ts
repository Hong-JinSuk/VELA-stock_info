import { api } from '@/lib/api/axios';
import type { FavoriteItem, FavoriteType } from '@/types/favorite';
import { useQuery } from '@tanstack/react-query';

// 내 즐겨찾기 목록 조회. type 생략 시 전체. (페이지네이션 없이 bare array)
async function fetchFavorites(type?: FavoriteType): Promise<FavoriteItem[]> {
  const qs = type ? `?type=${type}` : '';
  const { data } = await api.get<FavoriteItem[]>(`/favorites${qs}`);
  return data;
}

export function useFavorites(type?: FavoriteType) {
  return useQuery({
    queryKey: ['favorites', type ?? 'all'],
    queryFn: () => fetchFavorites(type),
    staleTime: 1000 * 60 * 5,
  });
}
