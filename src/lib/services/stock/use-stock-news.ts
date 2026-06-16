import { api } from '@/lib/api/axios';
import { usePersistentQuery } from '@/lib/services/use-persistent-query';
import type { StockNewsItem } from '@/types/stock';

async function fetchStockNews(
  ticker: string,
  name?: string,
): Promise<StockNewsItem[]> {
  const { data } = await api.get<StockNewsItem[]>(
    `/stock/${encodeURIComponent(ticker)}/news`,
    { params: name ? { name } : undefined },
  );
  return data;
}

// name(회사명)은 국내 RSS 검색 품질을 위해 detail 로드 후 함께 넘긴다.
export function useStockNews(ticker: string, name?: string) {
  return usePersistentQuery({
    queryKey: ['stock-news', ticker, name ?? ''],
    queryFn: () => fetchStockNews(ticker, name),
    enabled: Boolean(ticker),
    staleTime: 1000 * 60 * 15,
  });
}
