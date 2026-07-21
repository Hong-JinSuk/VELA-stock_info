import { api } from '@/lib/api/axios';
import type { TokenThroughputSeries } from '@/types/indicator-series';
import { useQuery } from '@tanstack/react-query';

// AI 토큰 처리량(OpenRouter) 일별 시계열. 서버가 6h 캐시하므로 클라도 길게 신뢰.
export function useTokenThroughput(enabled = true) {
  return useQuery({
    queryKey: ['token-throughput'],
    queryFn: async (): Promise<TokenThroughputSeries> => {
      const { data } = await api.get<TokenThroughputSeries>(
        '/indicators/token-throughput',
      );
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1h
  });
}
