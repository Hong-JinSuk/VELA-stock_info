import { api } from '@/lib/api/axios';
import type { EtfHoldingsData } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

// ETF 보유종목. 배치 미적재 ETF는 200 + null(섹션 미표시).
async function fetchHoldings(ticker: string): Promise<EtfHoldingsData | null> {
  const { data } = await api.get<EtfHoldingsData | null>(
    `/stock/${encodeURIComponent(ticker)}/holdings`,
  );
  return data;
}

export function useStockHoldings(ticker: string, enabled: boolean) {
  return useQuery({
    queryKey: ['etf-holdings', ticker],
    queryFn: () => fetchHoldings(ticker),
    enabled: enabled && Boolean(ticker),
    staleTime: 1000 * 60 * 60, // 보유종목은 천천히 변함 — 1시간
    meta: { ignoreGlobalError: true },
  });
}
