import { api } from '@/lib/api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

export function useOverviewSnapshotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['admin-overview-snapshot'],
    mutationFn: async () => {
      // gemini-server가 인사이트 생성 + DailySnapshot upsert까지 단일 책임으로 처리.
      const { data } = await api.post(
        `${GEMINI_SERVER}/overview-snapshot`,
        { trigger: 'MANUAL' },
        { timeout: 120_000 },
      );
      return data;
    },
    onSuccess: () => {
      toast.success('오버뷰 스냅샷이 갱신되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['overview-insight'] });
    },
    meta: {
      ignoreGlobalError: true,
    },
    onError: (error: Error) => {
      toast.error(error.message || '스냅샷 갱신에 실패했습니다.');
    },
  });
}
