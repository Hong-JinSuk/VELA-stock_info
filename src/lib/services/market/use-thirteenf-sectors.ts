import { api } from '@/lib/api/axios';
import type { ThirteenFSectorQuarter } from '@/types/thirteenf';
import { useQuery } from '@tanstack/react-query';

async function fetchSectors(cik: string): Promise<ThirteenFSectorQuarter[]> {
  const { data } = await api.get<ThirteenFSectorQuarter[]>('/13f/sectors', {
    params: { cik },
  });
  return data;
}

// filer(cik)의 최근 분기 섹터 배분 시계열. 배치가 채운 DB만 읽으므로 빠르다.
export function useThirteenFSectors(cik: string | undefined) {
  return useQuery({
    queryKey: ['13f-sectors', cik],
    queryFn: () => fetchSectors(cik!),
    enabled: !!cik,
    staleTime: 1000 * 60 * 60 * 6, // 6시간
    retry: 1,
  });
}
