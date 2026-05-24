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

export interface OverviewInsightResponse {
  insight: AiInsightData;
  dateKey: string;
  isToday: boolean;
}

async function fetchOverviewInsight(): Promise<OverviewInsightResponse | null> {
  const { data } = await api.get<OverviewInsightResponse | null>(
    '/overview/insight',
  );
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
