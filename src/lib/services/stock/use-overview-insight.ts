import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';

export interface SectorInsight {
  name: string;
  reason: string;
}

export interface AiInsightData {
  overview: string;
  promisingSectors: SectorInsight[];
  poorSectors: SectorInsight[];
}

async function fetchOverviewInsight(): Promise<AiInsightData | null> {
  const { data } = await api.get<AiInsightData | null>('/overview/insight');
  return data;
}

export function useOverviewInsight() {
  return useQuery({
    queryKey: ['overview-insight'],
    queryFn: fetchOverviewInsight,
    staleTime: 1000 * 60 * 60, // 1시간 캐시 (하루 1회 갱신)
    retry: 1,
  });
}
