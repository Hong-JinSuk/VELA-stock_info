import { api } from '@/lib/api/axios';
import type { EtfPerformance } from '@/types/sector';
import { useQuery } from '@tanstack/react-query';

// 섹터 분석 ETF 테이블의 기간 성과(현재가·1일~YTD·추이). 심볼 세트별 조회, 10분 캐시.
export function useEtfPerformance(symbols: string[]) {
  const sorted = [...symbols].sort();
  return useQuery({
    queryKey: ['etf-performance', sorted.join(',')],
    queryFn: async (): Promise<EtfPerformance[]> => {
      const { data } = await api.get<EtfPerformance[]>(
        `/stock/etf-performance?symbols=${encodeURIComponent(sorted.join(','))}`,
      );
      return data;
    },
    enabled: sorted.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
