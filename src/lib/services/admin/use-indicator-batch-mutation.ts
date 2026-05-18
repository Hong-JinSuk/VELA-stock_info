import { api } from '@/lib/api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

type IndicatorBatchResult = {
  dateKey: string;
  fred: number;
  yahoo: number;
  releaseDates: number;
};

export function useIndicatorBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<IndicatorBatchResult>({
    mutationKey: ['admin-indicator-batch'],
    mutationFn: async () => {
      // gemini-server가 FRED + Yahoo fetch + IndicatorSnapshot upsert까지 단일 책임으로 처리.
      const { data } = await api.post<IndicatorBatchResult>(
        `${GEMINI_SERVER}/indicator-batch`,
        undefined,
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `지표 스냅샷이 갱신되었습니다. (FRED ${data.fred}, Yahoo ${data.yahoo})`,
      );
      queryClient.invalidateQueries({ queryKey: ['indicator-snapshot'] });
    },
    meta: {
      ignoreGlobalError: true,
    },
    onError: (error: Error) => {
      toast.error(error.message || '지표 배치 갱신에 실패했습니다.');
    },
  });
}
