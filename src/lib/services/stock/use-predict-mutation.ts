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

      // 1. Context Refine (기존 유지)
      if (stockData) {
        const { data } = await api.post(
          '/ai/refine-context',
          { stockData },
          { timeout: 60000, signal },
        );
        refinedData = data.refinedData;
      }

      // 2. Predict (💡 스트리밍 우회 로직 적용)
      // Axios 인스턴스의 baseURL을 가져와서 fetch에 사용 (설정 환경에 맞게)
      const baseURL = api.defaults.baseURL || '';

      const response = await fetch(`${baseURL}/ai/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockName, refinedData }),
        signal,
      });

      if (!response.ok) {
        throw new Error('서버 응답 에러');
      }

      if (!response.body) {
        throw new Error('스트림을 받을 수 없습니다.');
      }

      // 스트림 읽기 준비
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      // 💡 여기서 데이터를 화면에 그리지 않고 조용히 백그라운드에서 끝까지 모읍니다.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // --- JSON 추출 로직 (백엔드에서 프론트로 이동) ---
      const startIndex = fullText.indexOf('{');
      const endIndex = fullText.lastIndexOf('}');

      let cleanText: string;
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        cleanText = fullText.substring(startIndex, endIndex + 1);
      } else {
        cleanText = fullText
          .replace(/^```json\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      const resultData = JSON.parse(cleanText) as AiPredictionResultType;

      if (resultData.isValidStock === false) {
        throw new Error('유효하지 않은 종목이거나 분석할 수 없습니다.');
      }

      // 3. 상태 업데이트 및 로그 저장
      setPredictResult(resultData);

      saveLog({
        stockName,
        queryData: { stockData },
        refineData: { refinedData },
        resultData: resultData,
      });

      return resultData;
    },
    onSuccess: () => {
      setAgentStatus('분석 완료');
    },
    onError: (error: any) => {
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

// export function usePredictMutation() {
//   const { mutate: saveLog } = useAiLogMutation();
//   const setPredictResult = useSetAtom(aiPredictResultAtom);
//   const setAgentStatus = useSetAtom(agentStatusAtom);

//   const predictMutation = useMutation({
//     mutationKey: ['predict-target-price'],
//     mutationFn: async ({
//       stockName,
//       stockData,
//       signal,
//     }: PredictData): Promise<AiPredictionResultType> => {
//       setAgentStatus('분석 중'); // 시작

//       let refinedData: string | undefined;

//       if (stockData) {
//         const { data } = await api.post(
//           '/ai/refine-context',
//           { stockData },
//           { timeout: 60000, signal },
//         );

//         refinedData = data.refinedData;
//       }

//       const { data } = await api.post<AiPredictionResultType>(
//         '/ai/predict',
//         { stockName, refinedData },
//         { timeout: 60000, signal },
//       );

//       setPredictResult(data);

//       saveLog({
//         stockName,
//         queryData: { stockData },
//         refineData: { refinedData },
//         resultData: data,
//       });

//       return data;
//     },
//     onSuccess: () => {
//       setAgentStatus('분석 완료');
//     },
//     onError: (error: any) => {
//       // 취소(abort)는 '사용 가능'으로, 그 외 에러는 '사용 만료'로
//       const isAbort =
//         error?.code === 'ERR_CANCELED' || error?.name === 'AbortError';
//       setAgentStatus(isAbort ? '사용 가능' : '사용 만료');
//     },
//     meta: {
//       ignoreGlobalError: true,
//     },
//   });

//   return { predictMutation };
// }
