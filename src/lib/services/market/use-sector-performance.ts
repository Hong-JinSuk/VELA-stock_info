import { api } from '@/lib/api/axios';
import type { SectorPerformance } from '@/types/sector';
import { useQuery } from '@tanstack/react-query';

// 섹터/산업 ETF 기간별 성과. 고정 세트 bounded 목록이라 bare array 응답 (페이지네이션 없음).
export function useSectorPerformance() {
  return useQuery({
    queryKey: ['sector-performance'],
    queryFn: async () => {
      const { data } = await api.get<SectorPerformance[]>('/sectors');
      return data;
    },
    // 서버 캐시 10분(unstable_cache) → 클라는 5분 신뢰.
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
