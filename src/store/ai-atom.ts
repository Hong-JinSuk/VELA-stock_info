import {
  AgentServiceType,
  AgentStatus,
  AiPredictionResultType,
} from '@/types/ai';
import { atom } from 'jotai';

// 전역적으로 단 하나의 AI 서비스만 동작하도록 관리하는 상태 (글로벌 락 방식)
export const activeAgentServiceAtom = atom<AgentServiceType>('IDLE');

// 에이전트의 동작 상태
export const agentStatusAtom = atom<AgentStatus>('사용 가능');

export interface AiFormState {
  stockName: string;
  stockData: string;
}

// 앱 전체에서 사용되는 AI 설정 및 예측 기초 상태 데이터를 담고 있는 아톰
export const aiPredictFormAtom = atom<AiFormState>({
  stockName: '',
  stockData: '',
});

export const aiPredictResultAtom = atom<AiPredictionResultType | null>(null);
