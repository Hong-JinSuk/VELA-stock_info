import { api } from '@/lib/api/axios';
import type { StockDetail } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

async function fetchStockDetail(ticker: string): Promise<StockDetail> {
  const { data } = await api.get<StockDetail>(
    `/stock/${encodeURIComponent(ticker)}`,
  );
  return data;
}

export function useStockDetail(ticker: string) {
  return useQuery({
    queryKey: ['stock-detail', ticker],
    queryFn: () => fetchStockDetail(ticker),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60, // 시세 포함이라 1분
  });
}
