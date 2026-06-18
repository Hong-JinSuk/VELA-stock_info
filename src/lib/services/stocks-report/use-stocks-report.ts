import { api } from '@/lib/api/axios';
import type { StockReportItem } from '@/types/stocks-report';
import { useQuery } from '@tanstack/react-query';

// 내 즐겨찾기 종목 적정주가 보고서. bounded 목록이라 bare array(페이지네이션 X).
async function fetchStocksReport(): Promise<StockReportItem[]> {
  const { data } = await api.get<StockReportItem[]>('/stocks-report');
  return data;
}

export function useStocksReport() {
  return useQuery({
    queryKey: ['stocks-report'],
    queryFn: fetchStocksReport,
    staleTime: 1000 * 60 * 5,
  });
}
