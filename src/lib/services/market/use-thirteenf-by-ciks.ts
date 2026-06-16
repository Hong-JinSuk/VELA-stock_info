import { api } from '@/lib/api/axios';
import type { ThirteenFListItem } from '@/types/thirteenf';
import { useQuery } from '@tanstack/react-query';

// 특정 filer(cik) 집합의 13F 리스트 행을 받는다 (즐겨찾기 등). bounded → bare array.
async function fetchByCiks(ciks: string[]): Promise<ThirteenFListItem[]> {
  if (ciks.length === 0) return [];
  const qs = ciks.map((c) => encodeURIComponent(c)).join(',');
  const { data } = await api.get<ThirteenFListItem[]>(`/13f/by-ciks?ciks=${qs}`);
  return data;
}

export function useThirteenFByCiks(ciks: string[]) {
  return useQuery({
    // 순서 무관하게 같은 집합이면 같은 키.
    queryKey: ['13f-by-ciks', [...ciks].sort().join(',')],
    queryFn: () => fetchByCiks(ciks),
    enabled: ciks.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}
