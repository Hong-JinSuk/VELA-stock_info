import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';

export type StockLogo = { symbol: string; logo: string | null };

// 심볼 세트의 회사 로고 URL(캐시 기반). 섹터 분석 종목/ETF 행 앞 배지에 사용.
// 로고는 거의 불변이라 길게 캐시. 서버가 미존재/실패를 logo=null로 내려 모노그램 폴백.
export function useStockLogos(symbols: string[]) {
  const sorted = [...symbols].sort();
  return useQuery({
    queryKey: ['stock-logos', sorted.join(',')],
    queryFn: async (): Promise<StockLogo[]> => {
      const { data } = await api.get<StockLogo[]>(
        `/stock/logos?symbols=${encodeURIComponent(sorted.join(','))}`,
      );
      return data;
    },
    enabled: sorted.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
