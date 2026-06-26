import { api } from '@/lib/api/axios';
import type { KeyIndicatorRef } from '@/types/macro-indicator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const KEY = ['admin-key-indicators'];

export function useAdminKeyIndicators() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<KeyIndicatorRef[]> => {
      const { data } = await api.get<KeyIndicatorRef[]>('/admin/key-indicators');
      return data;
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    // 사용자 노출용 공개 목록도 함께 무효화.
    qc.invalidateQueries({ queryKey: ['key-indicators'] });
  };
}

export function useAddKeyIndicator() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { indicatorId: string }) => {
      const { data } = await api.post('/admin/key-indicators', input);
      return data;
    },
    onSuccess: () => {
      toast.success('중요 지표에 추가되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '추가 실패'),
  });
}

export function useRemoveKeyIndicator() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (indicatorId: string) => {
      const { data } = await api.delete('/admin/key-indicators', {
        params: { indicatorId },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('중요 지표에서 제거되었습니다.');
      invalidate();
    },
    meta: { ignoreGlobalError: true },
    onError: (e: Error) => toast.error(e.message || '제거 실패'),
  });
}
