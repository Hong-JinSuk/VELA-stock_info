import { api } from '@/lib/api/axios';
import { agentStatusAtom, aiPredictResultAtom } from '@/store/ai-atom';
import { AiPredictionResultType } from '@/types/ai';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useAiLogMutation } from './use-ai-log';

type PredictData = {
  stockName: string;
  stockData?: string;
  signal?: AbortSignal;
};

type PredictMutationData = {
  result: AiPredictionResultType;
  refinedData?: string;
};

const GEMINI_SERVER = process.env.NEXT_PUBLIC_GEMINI_SERVER;

export function usePredictMutation() {
  const { mutate: saveLog } = useAiLogMutation();
  const setPredictResult = useSetAtom(aiPredictResultAtom);
  const setAgentStatus = useSetAtom(agentStatusAtom);
  const { update: updateSession } = useSession();

  const predictMutation = useMutation({
    mutationKey: ['predict-target-price'],
    mutationFn: async ({
      stockName,
      stockData,
      signal,
    }: PredictData): Promise<PredictMutationData> => {
      setAgentStatus('분석 중');

      let refinedData: string | undefined;

      if (stockData) {
        const { data } = await api.post(
          `${GEMINI_SERVER}/ai/refine-context`,
          { stockData },
          { timeout: 60000, signal },
        );
        refinedData = data.refinedData;
      }

      const { data } = await api.post<AiPredictionResultType>(
        `${GEMINI_SERVER}/ai/predict`,
        { stockName, refinedData },
        { timeout: 60000, signal },
      );

      setPredictResult(data);

      return { result: data, refinedData };
    },
    onSuccess: async ({ result, refinedData }, { stockName, stockData }) => {
      saveLog({
        stockName,
        queryData: { stockData },
        refineData: { refinedData },
        resultData: result,
      });
      await api.post('/usage/increment');
      setAgentStatus('분석 완료');
      await updateSession();
    },
    onError: (error: any) => {
      // 수정필요한 부분
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
