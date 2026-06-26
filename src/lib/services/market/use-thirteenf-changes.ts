import { api } from '@/lib/api/axios';
import type { PaginatedResponse } from '@/lib/api/pagination';
import type { ThirteenFChangeRow } from '@/types/thirteenf';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export type ThirteenFChangeType = 'buy' | 'sell' | 'hold';

async function fetchChanges(
  accession: string,
  type: ThirteenFChangeType,
  page: number,
  size: number,
  searchKey: string,
): Promise<PaginatedResponse<ThirteenFChangeRow>> {
  const { data } = await api.get<PaginatedResponse<ThirteenFChangeRow>>(
    `/13f/${accession}/changes`,
    {
      params: { type, page, size, ...(searchKey ? { searchKey } : {}) },
      timeout: 30_000,
    },
  );
  return data;
}

// 한 filing의 buys/sells/holds 한 페이지. searchKey로 종목명/티커 검색. 모달 열렸을 때만 호출.
export function useThirteenFChanges(
  accession: string,
  type: ThirteenFChangeType,
  page: number,
  size: number,
  searchKey: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['13f-changes', accession, type, page, size, searchKey],
    queryFn: () => fetchChanges(accession, type, page, size, searchKey),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60 * 6, // 6시간 (immutable filing)
    retry: 1,
  });
}
