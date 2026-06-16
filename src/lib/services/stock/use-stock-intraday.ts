import type { StockIntradayResult } from '@/app/api/stock/intraday/route';
import { api } from '@/lib/api/axios';
import type { StockIntradayPoint } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

// 다건 종목의 1일 인트라데이를 한 번에 받아 symbol→points 맵으로 돌려준다. bounded → bare array.
async function fetchIntraday(
  symbols: string[],
): Promise<Map<string, StockIntradayPoint[]>> {
  if (symbols.length === 0) return new Map();
  const qs = symbols.map((s) => encodeURIComponent(s)).join(',');
  const { data } = await api.get<StockIntradayResult[]>(
    `/stock/intraday?symbols=${qs}`,
    { timeout: 30000 }, // 종목 많으면 Yahoo 다건이라 길어질 수 있음
  );
  return new Map(data.map((r) => [r.symbol, r.points]));
}

export function useStockIntraday(symbols: string[]) {
  return useQuery({
    queryKey: ['stock-intraday', [...symbols].sort().join(',')],
    queryFn: () => fetchIntraday(symbols),
    enabled: symbols.length > 0,
    staleTime: 1000 * 60, // 60초
  });
}
