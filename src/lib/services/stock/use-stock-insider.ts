import { api } from '@/lib/api/axios';
import type { InsiderAnalysis } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

async function fetchStockInsider(ticker: string): Promise<InsiderAnalysis> {
  const { data } = await api.get<InsiderAnalysis>(
    `/stock/${encodeURIComponent(ticker)}/insider`,
  );
  return data;
}

export function useStockInsider(ticker: string) {
  return useQuery({
    queryKey: ['stock-insider', ticker],
    queryFn: () => fetchStockInsider(ticker),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 30,
  });
}
