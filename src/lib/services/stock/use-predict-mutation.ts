import { api } from '@/lib/api/axios';
import { agentStatusAtom, aiPredictResultAtom } from '@/store/ai-atom';
import { AiPredictionResultType } from '@/types/ai';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useAiLogMutation } from './use-ai-log';

type PredictData = {
  stockName: string;
  stockData?: string;
  signal?: AbortSignal;
};

export function usePredictMutation() {
  const { mutate: saveLog } = useAiLogMutation();
  const setPredictResult = useSetAtom(aiPredictResultAtom);
  const setAgentStatus = useSetAtom(agentStatusAtom);

  const predictMutation = useMutation({
    mutationKey: ['predict-target-price'],
    mutationFn: async ({
      stockName,
      stockData,
      signal,
    }: PredictData): Promise<AiPredictionResultType> => {
      setAgentStatus('분석 중'); // 시작

      let refinedData: string | undefined;

      if (stockData) {
        const { data } = await api.post(
          '/ai/refine-context',
          { stockData },
          { timeout: 60000, signal },
        );

        refinedData = data.refinedData;
      }

      const { data } = await api.post<AiPredictionResultType>(
        '/ai/predict',
        { stockName, refinedData },
        { timeout: 60000, signal },
      );

      setPredictResult(data);

      saveLog({
        stockName,
        queryData: { stockData },
        refineData: { refinedData },
        resultData: data,
      });

      return data;
    },
    onSuccess: () => {
      setAgentStatus('분석 완료');
    },
    onError: (error: any) => {
      // 취소(abort)는 '사용 가능'으로, 그 외 에러는 '사용 만료'로
      const isAbort =
        error?.code === 'ERR_CANCELED' || error?.name === 'AbortError';
      setAgentStatus(isAbort ? '사용 가능' : '사용 만료');
    },
    meta: {
      ignoreGlobalError: true,
    },
  });

  return { predictMutation };
}
