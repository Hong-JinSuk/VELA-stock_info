import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';

export type ThirteenFFiler = {
  cik: string;
  name: string;
  krName?: string | null;
  krNickname?: string | null;
  lastFiledDate: string;
};

const SUGGEST_LIMIT = 8;

async function fetchFilers(searchKey: string): Promise<ThirteenFFiler[]> {
  const { data } = await api.get<{ filers: ThirteenFFiler[] }>('/13f/filers', {
    params: { searchKey, limit: SUGGEST_LIMIT },
  });
  return data.filers;
}

// 입력별 서버 사이드 검색. searchKey가 1자 이상일 때만 호출 (debounce는 호출 측 책임).
// (queryKey, searchKey)별 5분 캐시 — 같은 검색어 재입력 시 즉시 응답.
export function useThirteenFFilers(searchKey: string) {
  const trimmed = searchKey.trim();
  return useQuery({
    queryKey: ['13f-filers', trimmed],
    queryFn: () => fetchFilers(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}
