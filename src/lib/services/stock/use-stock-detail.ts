import { api } from '@/lib/api/axios';
import { usePersistentQuery } from '@/lib/services/use-persistent-query';
import type { StockDetail } from '@/types/stock';

async function fetchStockDetail(ticker: string): Promise<StockDetail> {
  const { data } = await api.get<StockDetail>(
    `/stock/${encodeURIComponent(ticker)}`,
  );
  return data;
}

export function useStockDetail(ticker: string) {
  // 재진입 시 localStorage 스냅샷으로 즉시 표시 + 백그라운드 갱신.
  return usePersistentQuery({
    queryKey: ['stock-detail', ticker],
    queryFn: () => fetchStockDetail(ticker),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60, // 시세 포함이라 1분
  });
}
