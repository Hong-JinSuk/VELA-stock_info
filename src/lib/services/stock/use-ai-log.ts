import { api } from '@/lib/api/axios';
import { AiPredictionResultType } from '@/types/ai';
import { useMutation } from '@tanstack/react-query';

type LogParams = {
  stockName: string;
  queryData?: unknown;
  refineData?: unknown;
  resultData: AiPredictionResultType;
};

export function useAiLogMutation() {
  return useMutation({
    mutationKey: ['save-ai-log'],
    mutationFn: async (params: LogParams) => {
      const { data } = await api.post('/ai/log', params);
      if (data.status !== 201) {
        throw new Error('로그를 저장하지 못했어요! 관리자에게 문의해주세요');
      }

      return data;
    },
  });
}
