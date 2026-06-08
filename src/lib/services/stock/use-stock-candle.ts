import { api } from '@/lib/api/axios';
import type { StockCandlePoint } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

export type CandleRange = '1mo' | '6mo' | '1y' | 'ytd';

async function fetchStockCandle(
  ticker: string,
  range: CandleRange,
): Promise<StockCandlePoint[]> {
  const { data } = await api.get<StockCandlePoint[]>(
    `/stock/${encodeURIComponent(ticker)}/candle`,
    { params: { range } },
  );
  return data;
}

export function useStockCandle(ticker: string, range: CandleRange = '6mo') {
  return useQuery({
    queryKey: ['stock-candle', ticker, range],
    queryFn: () => fetchStockCandle(ticker, range),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 30,
  });
}
