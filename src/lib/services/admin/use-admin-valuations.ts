import { api } from '@/lib/api/axios';
import type { AdminValuationSectorGroup } from '@/types/valuation';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

// 적정주가 조정 관리 목록(ADMIN).
export function useAdminValuations() {
  return useQuery({
    queryKey: ['admin-valuations'],
    queryFn: async () => {
      const { data } =
        await api.get<AdminValuationSectorGroup[]>('/admin/valuation');
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// 수동 조정 성장률 설정/해제. 저장 후 해당 종목 재스냅샷되므로 목록·보고서·섹터 캐시 무효화.
export function useSetGrowthOverrideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['set-growth-override'],
    mutationFn: async (vars: {
      symbol: string;
      growthOverride: number | null;
    }) => {
      // 서버가 응답 전 gemini 재스냅샷(최대 20s)을 await하므로, 기본 10s보다 길게 준다.
      const { data } = await api.patch<{
        symbol: string;
        growthOverride: number | null;
      }>(
        `/admin/valuation/${encodeURIComponent(vars.symbol)}`,
        { growthOverride: vars.growthOverride },
        { timeout: 25000 },
      );
      return data;
    },
    onSuccess: ({ symbol, growthOverride }) => {
      toast.success(
        growthOverride == null
          ? `${symbol} 조정 해제 (자동 성장률 적용)`
          : `${symbol} 조정 성장률 ${growthOverride}% 적용`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-valuations'] });
      queryClient.invalidateQueries({ queryKey: ['stocks-report'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-sector'] });
    },
    meta: { ignoreGlobalError: true },
    onError: (error: Error) => {
      toast.error(error.message || '조정 저장에 실패했습니다.');
    },
  });
}

// "섹터 미지정" 관리 대상(ValuationWatch)에 종목 추가. 추가 후 즉시 스냅샷되므로 목록 무효화.
export function useAddValuationWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      const { data } = await api.post<{ symbol: string }>(
        '/admin/valuation/watch',
        { symbol },
        { timeout: 25000 }, // 서버가 즉시 스냅샷(최대 20s)을 await하므로 기본 10s보다 길게.
      );
      return data;
    },
    onSuccess: ({ symbol }) => {
      toast.success(`${symbol} 추가됨`);
      queryClient.invalidateQueries({ queryKey: ['admin-valuations'] });
    },
    meta: { ignoreGlobalError: true },
    onError: (error: Error) => {
      toast.error(error.message || '추가에 실패했습니다.');
    },
  });
}

// "섹터 미지정" 관리 대상에서 종목 제거.
export function useRemoveValuationWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      const { data } = await api.delete<{ symbol: string }>(
        `/admin/valuation/watch/${encodeURIComponent(symbol)}`,
      );
      return data;
    },
    onSuccess: ({ symbol }) => {
      toast.success(`${symbol} 제거됨`);
      queryClient.invalidateQueries({ queryKey: ['admin-valuations'] });
      queryClient.invalidateQueries({ queryKey: ['stocks-report'] });
    },
    meta: { ignoreGlobalError: true },
    onError: (error: Error) => {
      toast.error(error.message || '제거에 실패했습니다.');
    },
  });
}
