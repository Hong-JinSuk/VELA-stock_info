import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';

// 경제지표 페이지 상단 "중요 지표"로 노출할 indicatorId 목록 (sortOrder 오름차순).
async function fetchKeyIndicators(): Promise<string[]> {
  const { data } = await api.get<string[]>('/overview/key-indicators');
  return data;
}

export function useKeyIndicators() {
  return useQuery({
    queryKey: ['key-indicators'],
    queryFn: fetchKeyIndicators,
    staleTime: 1000 * 60 * 5,
  });
}
