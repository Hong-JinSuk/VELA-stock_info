import { api } from '@/lib/api/axios';
import { usePersistentQuery } from '@/lib/services/use-persistent-query';
import type { InsiderAnalysis } from '@/types/stock';

async function fetchStockInsider(ticker: string): Promise<InsiderAnalysis> {
  const { data } = await api.get<InsiderAnalysis>(
    `/stock/${encodeURIComponent(ticker)}/insider`,
  );
  return data;
}

export function useStockInsider(ticker: string) {
  return usePersistentQuery({
    queryKey: ['stock-insider', ticker],
    queryFn: () => fetchStockInsider(ticker),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 30,
  });
}
