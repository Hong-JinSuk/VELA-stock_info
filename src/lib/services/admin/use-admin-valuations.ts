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
      const { data } = await api.patch<{
        symbol: string;
        growthOverride: number | null;
      }>(`/admin/valuation/${encodeURIComponent(vars.symbol)}`, {
        growthOverride: vars.growthOverride,
      });
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
