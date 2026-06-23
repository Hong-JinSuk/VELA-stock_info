import { api } from '@/lib/api/axios';
import type { EarningsSurprise } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

async function fetchStockEarnings(ticker: string): Promise<EarningsSurprise> {
  const { data } = await api.get<EarningsSurprise>(
    `/stock/${encodeURIComponent(ticker)}/earnings`,
  );
  return data;
}

export function useStockEarnings(ticker: string) {
  return useQuery({
    queryKey: ['stock-earnings', ticker],
    queryFn: () => fetchStockEarnings(ticker),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 60, // 1h (분기 데이터라 자주 안 바뀜)
  });
}
