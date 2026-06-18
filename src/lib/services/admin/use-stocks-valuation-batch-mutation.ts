import { api } from '@/lib/api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

type StocksValuationResult = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
};

// 적정주가(종목 보고서) 수동 배치. symbols 없이 호출 → 가장 오래된 것부터(미스냅샷 우선) limit개 스냅샷.
export function useStocksValuationBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<StocksValuationResult>({
    mutationKey: ['admin-stocks-valuation-batch'],
    mutationFn: async () => {
      const { data } = await api.post<StocksValuationResult>(
        `${GEMINI_SERVER}/stocks-valuation-sync`,
        { limit: 50 },
        { timeout: 180_000 },
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `적정주가 스냅샷 완료 (갱신 ${data.updated}, 추정불가 ${data.skipped}, 실패 ${data.failed})`,
      );
      queryClient.invalidateQueries({ queryKey: ['stocks-report'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-sector'] });
    },
    meta: { ignoreGlobalError: true },
    onError: (error: Error) => {
      toast.error(error.message || '적정주가 배치에 실패했습니다.');
    },
  });
}
