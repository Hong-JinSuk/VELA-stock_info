import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';

export type ThirteenFFiler = {
  cik: string;
  name: string;
  lastFiledDate: string;
};

async function fetchFilers(): Promise<ThirteenFFiler[]> {
  const { data } = await api.get<{ filers: ThirteenFFiler[] }>('/13f/filers');
  return data.filers;
}

// 정적 데이터라 한 번 받아두고 길게 캐시. enabled로 lazy fetch (검색창 포커스 후 첫 입력).
export function useThirteenFFilers(enabled: boolean) {
  return useQuery({
    queryKey: ['13f-filers'],
    queryFn: fetchFilers,
    staleTime: 1000 * 60 * 60, // 1시간 fresh
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled,
  });
}
