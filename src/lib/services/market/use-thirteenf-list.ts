import { api } from '@/lib/api/axios';
import type { ThirteenFListResponse } from '@/types/thirteenf';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

type Params = {
  searchKey?: string; // filer 이름 검색어. 비어 있으면 기본 목록.
  page?: number;
  size?: number;
};

async function fetchThirteenFList({
  searchKey,
  page,
  size,
}: Params): Promise<ThirteenFListResponse> {
  const params = new URLSearchParams();
  if (searchKey) params.set('searchKey', searchKey);
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
    queryKey: [
      '13f-list',
      params.searchKey ?? '',
      params.page ?? 1,
      params.size ?? 20,
    ],
    queryFn: () => fetchThirteenFList(params),
    // 13F는 분기별이라 서버 cache(1시간)에 맡기고 클라는 30분 정도 신뢰.
    staleTime: 1000 * 60 * 30,
    // 페이지 전환 시 이전 페이지 데이터를 유지해 깜빡임 방지.
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
