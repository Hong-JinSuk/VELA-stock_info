import { api } from '@/lib/api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

type ThirteenFFilersBatchResult = { count: number };

export function useThirteenFFilersBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<ThirteenFFilersBatchResult>({
    mutationKey: ['admin-13f-filers-batch'],
    mutationFn: async () => {
      // gemini-server가 SEC form.idx fetch + ThirteenFFiler TRUNCATE/INSERT까지 단일 책임으로 처리.
      const { data } = await api.post<ThirteenFFilersBatchResult>(
        `${GEMINI_SERVER}/thirteenf-filers-batch`,
        { trigger: 'MANUAL' },
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(`13F 데이터가 갱신되었습니다. (${data.count}개)`);
      queryClient.invalidateQueries({ queryKey: ['13f-filers'] });
    },
    meta: {
      ignoreGlobalError: true,
    },
    onError: (error: Error) => {
      toast.error(error.message || '13F 매니저 명단 갱신에 실패했습니다.');
    },
  });
}
