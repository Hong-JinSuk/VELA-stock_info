import { api } from '@/lib/api/axios';
import { agentStatusAtom, aiPredictResultAtom } from '@/store/ai-atom';
import { AiPredictionResultType } from '@/types/ai';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAiLogMutation } from './use-ai-log';

const PREDICT_PATH = '/ai/stocks/predict';

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
const PREDICTION_CANCELED_MESSAGE = '분석이 취소되었습니다.';

function isCanceledError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      (error as { code?: string }).code === 'ERR_CANCELED')
  );
}

function createPredictionCanceledError() {
  const error = new Error(PREDICTION_CANCELED_MESSAGE);
  error.name = 'CanceledError';
  (error as { code?: string }).code = 'ERR_CANCELED';

  return error;
}

export function usePredictMutation() {
  const { mutate: saveLog } = useAiLogMutation();
  const setPredictResult = useSetAtom(aiPredictResultAtom);
  const setAgentStatus = useSetAtom(agentStatusAtom);
  const { update: updateSession } = useSession();
  const router = useRouter();

  const predictMutation = useMutation({
    mutationKey: ['predict-target-price'],
    mutationFn: async ({
      stockName,
      stockData,
      signal,
    }: PredictData): Promise<PredictMutationData> => {
      try {
        setAgentStatus('분석 중');

        let refinedData: string | undefined;

        if (stockData) {
          const { data } = await api.post(
            `${GEMINI_SERVER}/refine-context`,
            { stockData },
            { timeout: 60000, signal },
          );
          refinedData = data.refinedData;
        }

        const { data } = await api.post<AiPredictionResultType>(
          `${GEMINI_SERVER}/predict`,
          { stockName, refinedData },
          { timeout: 60000, signal },
        );

        setPredictResult(data);

        return { result: data, refinedData };
      } catch (error) {
        if (isCanceledError(error)) {
          throw createPredictionCanceledError();
        }

        throw error;
      }
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
    onError: (error: unknown) => {
      console.log('error : ', error);
      if (isCanceledError(error)) {
        setAgentStatus('분석 취소');
        return;
      }

      setAgentStatus('분석 오류');
    },
    onSettled: (data, error, variables) => {
      // predict 페이지에 있으면 알림 불필요. 사용자가 직접 취소한 경우도 스킵.
      if (window.location.pathname.endsWith(PREDICT_PATH)) return;
      if (error && isCanceledError(error)) return;

      const action = {
        label: '결과 보기',
        onClick: () => router.push(PREDICT_PATH),
      };

      if (data) {
        toast.success('AI 예측 분석이 완료되었습니다.', {
          description: `"${variables.stockName}" 결과를 확인해보세요.`,
          action,
        });
      } else {
        toast.error('AI 예측 분석에 실패했습니다.', {
          description: `"${variables.stockName}" 분석 중 오류가 발생했습니다.`,
          action,
        });
      }
    },
    meta: {
      ignoreGlobalError: true,
    },
  });

  return { predictMutation };
}
