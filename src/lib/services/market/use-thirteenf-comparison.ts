import { api } from '@/lib/api/axios';
import type { ThirteenFComparison } from '@/types/thirteenf';
import { useQuery } from '@tanstack/react-query';

async function fetchComparison(accession: string): Promise<ThirteenFComparison> {
  const { data } = await api.get<ThirteenFComparison>(
    `/13f/${accession}/comparison`,
    { timeout: 30_000 }, // SEC raw XML 두 분기 다운로드 + 파싱 시간이 첫 호출엔 길 수 있음
  );
  return data;
}

export function useThirteenFComparison(accession: string | undefined) {
  return useQuery({
    queryKey: ['13f-comparison', accession],
    queryFn: () => fetchComparison(accession!),
    enabled: !!accession,
    staleTime: 1000 * 60 * 60 * 6, // 6시간
    retry: 1,
  });
}
