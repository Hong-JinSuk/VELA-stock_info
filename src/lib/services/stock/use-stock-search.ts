import { api } from '@/lib/api/axios';
import type { StockSearchItem } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';

async function fetchSearch(q: string): Promise<StockSearchItem[]> {
  const { data } = await api.get<StockSearchItem[]>('/stock/search', {
    params: { q },
  });
  return data;
}

// 종목 자동완성. q가 2자 이상일 때만 호출 (debounce는 호출 측 책임).
// 1글자 검색은 결과가 너무 광범위하고 Finnhub 호출만 먹어 제외.
// Finnhub 호출이라: (1) 검색어별 1시간 캐시로 같은 입력 재호출 0,
// (2) 키 입력마다 429 toast가 뜨지 않도록 글로벌 에러는 무시.
const MIN_QUERY_LEN = 2;

export function useStockSearch(q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ['stock-search', trimmed],
    queryFn: () => fetchSearch(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LEN,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    meta: { ignoreGlobalError: true },
  });
}
