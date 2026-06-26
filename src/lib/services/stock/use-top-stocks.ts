import { api } from '@/lib/api/axios';
import type { TopStock } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

async function fetchTopStocks(): Promise<TopStock[]> {
  const { data } = await api.get<TopStock[]>('/stocks/top');
  return data;
}

// 종목찾기 빈 랜딩의 인기 대형주 TOP20. 배치 스냅샷이라 staleTime 길게.
export function useTopStocks() {
  return useQuery({
    queryKey: ['top-stocks'],
    queryFn: fetchTopStocks,
    staleTime: 1000 * 60 * 10,
  });
}
