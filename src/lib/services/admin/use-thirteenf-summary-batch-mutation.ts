import { api } from '@/lib/api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

// 한 번 클릭 = 요약 오래된 순으로 limit개 filer 처리(청크). 부트스트랩 시 반복 클릭.
const BATCH_LIMIT = 5;

type ThirteenFSummaryBatchResult = { processed: number; failed: number };

export function useThirteenFSummaryBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<ThirteenFSummaryBatchResult>({
    mutationKey: ['admin-13f-summary-batch'],
    mutationFn: async () => {
      // gemini-server가 SEC/Finnhub fetch + ThirteenFSummary/AumPoint/TickerSector write까지 단일 책임.
      // 콜드 패스는 filer당 수십 초라 timeout 넉넉히.
      const { data } = await api.post<ThirteenFSummaryBatchResult>(
        `${GEMINI_SERVER}/thirteenf-summary`,
        { limit: BATCH_LIMIT, trigger: 'MANUAL' },
        { timeout: 300_000 },
      );
      return data;
    },
    onSuccess: ({ processed, failed }) => {
      toast.success(
        `13F 요약 배치 완료. 처리 ${processed}건${failed ? `, 실패 ${failed}건` : ''}`,
      );
      queryClient.invalidateQueries({ queryKey: ['13f-summary'] });
    },
    meta: {
      ignoreGlobalError: true,
    },
    onError: (error: Error) => {
      toast.error(error.message || '13F 요약 배치에 실패했습니다.');
    },
  });
}
