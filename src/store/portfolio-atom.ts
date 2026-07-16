import { ASSET_CLASSES, type AssetClass } from '@/constants/asset-classes';
import type { TemplateId } from '@/constants/portfolio-templates';
import type { Holdings } from '@/types/portfolio';
import { atomWithStorage } from 'jotai/utils';

// 포트폴리오 진단 입력값을 localStorage에 보존(MVP: 서버 저장 없음). 재방문 시 그대로 복원.
// ⚠️ atomWithStorage는 SSR 시 초기값을 반환하므로, 소비 컴포넌트는 mounted 가드로 렌더한다.

const EMPTY_TARGET = ASSET_CLASSES.reduce(
  (acc, c) => {
    acc[c] = 0;
    return acc;
  },
  {} as Record<AssetClass, number>,
);

export const EMPTY_HOLDINGS: Holdings = {
  stocks: [],
  amounts: { BOND: 0, REAL_ESTATE: 0, CASH: 0, ETC: 0 },
};

// 선택한 모델 포트폴리오. 미선택은 null.
export const selectedTemplateAtom = atomWithStorage<TemplateId | null>(
  'vela.portfolio.template',
  null,
);

// 사용자가 입력한 보유 자산.
export const holdingsAtom = atomWithStorage<Holdings>(
  'vela.portfolio.holdings',
  EMPTY_HOLDINGS,
);

// CUSTOM 템플릿일 때 사용자가 직접 정한 목표 비중(%).
export const customTargetAtom = atomWithStorage<Record<AssetClass, number>>(
  'vela.portfolio.customTarget',
  EMPTY_TARGET,
);
