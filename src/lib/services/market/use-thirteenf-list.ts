import { api } from '@/lib/api/axios';
import type { ThirteenFListResponse } from '@/types/thirteenf';
import { useQuery } from '@tanstack/react-query';

type Params = {
  q?: string;
  page?: number;
  size?: number;
};

async function fetchThirteenFList({
  q,
  page,
  size,
}: Params): Promise<ThirteenFListResponse> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page) params.set('page', String(page));
  if (size) params.set('size', String(size));
  const qs = params.toString();
  const { data } = await api.get<ThirteenFListResponse>(
    `/13f${qs ? `?${qs}` : ''}`,
  );
  return data;
}

export function useThirteenFList(params: Params = {}) {
  return useQuery({
    queryKey: ['13f-list', params.q ?? '', params.page ?? 1, params.size ?? 20],
    queryFn: () => fetchThirteenFList(params),
    // 13F는 분기별이라 서버 cache(1시간)에 맡기고 클라는 30분 정도 신뢰.
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
