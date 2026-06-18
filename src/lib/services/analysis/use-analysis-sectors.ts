import { api } from '@/lib/api/axios';
import type {
  AnalysisSectorDetail,
  AnalysisSectorListItem,
} from '@/types/analysis';
import { useQuery } from '@tanstack/react-query';

// 섹터 목록 (조회). bounded → bare array.
export function useAnalysisSectors() {
  return useQuery({
    queryKey: ['analysis-sectors'],
    queryFn: async (): Promise<AnalysisSectorListItem[]> => {
      const { data } = await api.get<AnalysisSectorListItem[]>(
        '/analysis/sectors',
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 섹터 상세 (조회) — 종목별 적정주가 포함.
export function useAnalysisSectorDetail(slug: string) {
  return useQuery({
    queryKey: ['analysis-sector', slug],
    queryFn: async (): Promise<AnalysisSectorDetail> => {
      const { data } = await api.get<AnalysisSectorDetail>(
        `/analysis/sectors/${encodeURIComponent(slug)}`,
      );
      return data;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}
