// main-header 에서 사용될 에이전트 타입
export type AgentStatus =
  | '사용 가능'
  | '분석 중'
  | '분석 완료'
  | '사용 만료'
  | '로그인 필요';

// 앱 전체에서 사용될 AI 서비스들의 고유 타입
export type AgentServiceType = 'IDLE' | 'PREDICT' | 'COMPARE' | 'PORTFOLIO';

export interface TargetPrediction {
  targetPrice: string;
  upsidePotential: string;
}

export interface AiPredictionResultType {
  targetStockName?: string;
  isValidStock: boolean;
  errorReason?: string;
  currentPrice: string;
  recommendation: '강력 매수' | '매수' | '보류' | '매도' | '강력 매도';
  oneLineSummary: string;
  predictions: {
    '1m': TargetPrediction;
    '3m': TargetPrediction;
    '6m': TargetPrediction;
    '9m': TargetPrediction;
    '12m': TargetPrediction;
  };
  confidence: string;
  rationale: string;
  bullCase: string;
  bearCase: string;
}

// AI 예측 상태 데이터를 담는 인터페이스
export type AiPredictState = {
  stockName: string; // 분석할 주식 종목 이름 (예: NVDA)
  stockData: string; // 사용자가 입력한 추가 마켓 문맥 데이터
  loading: boolean; // 현재 AI의 예측이 진행 중인지 여부
  result: AiPredictionResultType | null; // 정상 처리 완료 후 반환된 예측 결과 데이터
  error: string; // 프로세스 도중 발생한 에러 메시지
  abortController: AbortController | null; // 진행 중인 AI 분석(Fetch)을 중단하기 위한 컨트롤러
  agentStatus: AgentStatus; // 우측 상단 UI에 반영하기 위한 에이전트 동작 상태
};
