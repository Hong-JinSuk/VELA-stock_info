import { api } from '@/lib/api/axios';
import type { StockQuoteItem } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

// 다건 종목의 요약 시세(이름 + 현재가 + 등락)를 한 번에 받는다. bounded → bare array.
async function fetchQuotes(symbols: string[]): Promise<StockQuoteItem[]> {
  if (symbols.length === 0) return [];
  const qs = symbols.map((s) => encodeURIComponent(s)).join(',');
  const { data } = await api.get<StockQuoteItem[]>(`/stock/quotes?symbols=${qs}`);
  return data;
}

export function useStockQuotes(symbols: string[]) {
  return useQuery({
    // 순서 무관하게 같은 집합이면 같은 키.
    queryKey: ['stock-quotes', [...symbols].sort().join(',')],
    queryFn: () => fetchQuotes(symbols),
    enabled: symbols.length > 0,
    staleTime: 1000 * 60, // 시세 60초
  });
}
