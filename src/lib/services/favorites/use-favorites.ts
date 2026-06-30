import { api } from '@/lib/api/axios';
import type { FavoriteItem, FavoriteType } from '@/types/favorite';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// 내 즐겨찾기 목록 조회. type 생략 시 전체. (페이지네이션 없이 bare array)
async function fetchFavorites(type?: FavoriteType): Promise<FavoriteItem[]> {
  const qs = type ? `?type=${type}` : '';
  const { data } = await api.get<FavoriteItem[]>(`/favorites${qs}`);
  return data;
}

export function useFavorites(type?: FavoriteType) {
  // 즐겨찾기는 로그인 전용 기능. 비로그인(GUEST)일 땐 쿼리를 발동하지 않는다.
  // (공용 FavoriteButton이 시장 데이터 등 공개 페이지에도 렌더되므로, 가드가 없으면
  //  GUEST 접속 시 /api/favorites가 401을 내고 전역 토스트로 "로그인이 필요합니다"가 뜬다.)
  const { status } = useSession();

  return useQuery({
    queryKey: ['favorites', type ?? 'all'],
    queryFn: () => fetchFavorites(type),
    enabled: status === 'authenticated',
    staleTime: 1000 * 60 * 5,
  });
}
