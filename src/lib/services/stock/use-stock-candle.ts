import { api } from '@/lib/api/axios';
import { usePersistentQuery } from '@/lib/services/use-persistent-query';
import type { StockCandlePoint } from '@/types/stock';

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
  return usePersistentQuery({
    queryKey: ['stock-candle', ticker, range],
    queryFn: () => fetchStockCandle(ticker, range),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 30,
  });
}
