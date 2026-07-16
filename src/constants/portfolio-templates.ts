import type { AssetClass } from './asset-classes';

// 사용자가 고르는 모델 포트폴리오(목표 배분). 경제학적으로 유명한 3종 + 주식 100% + 커스텀.
// allocations는 5개 자산군 합이 100. CUSTOM은 allocations 없이 사용자가 직접 목표 비중을 입력한다.

export type TemplateId =
  | 'SIXTY_FORTY'
  | 'ALL_WEATHER'
  | 'PERMANENT'
  | 'ALL_STOCK'
  | 'CUSTOM';

export type PortfolioTemplate = {
  id: TemplateId;
  name: string;
  author?: string; // 고안자 (예: 레이 달리오)
  tagline: string; // 한 줄 요약
  description: string;
  allocations?: Record<AssetClass, number>; // 합 100. CUSTOM은 없음
};

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  {
    id: 'SIXTY_FORTY',
    name: '60/40 포트폴리오',
    tagline: '가장 전통적인 주식·채권 균형',
    description:
      '주식 60 · 채권 40. 수십 년간 자산배분의 기준이 된 고전적 균형 배분.',
    allocations: { STOCK: 60, BOND: 40, REAL_ESTATE: 0, CASH: 0, ETC: 0 },
  },
  {
    id: 'ALL_WEATHER',
    name: '올웨더 포트폴리오',
    author: '레이 달리오',
    tagline: '어떤 경제 국면에도 견디는 분산',
    description:
      '주식 30 · 채권 55 · 기타(금·원자재) 15. 성장·침체·인플레·디플레 전 국면 대응을 노린 배분.',
    allocations: { STOCK: 30, BOND: 55, REAL_ESTATE: 0, CASH: 0, ETC: 15 },
  },
  {
    id: 'PERMANENT',
    name: '영구 포트폴리오',
    author: '해리 브라운',
    tagline: '4등분으로 극단을 방어',
    description:
      '주식 · 채권 · 현금 · 기타(금) 각 25%. 단순하지만 위기 국면에 강한 4분할 배분.',
    allocations: { STOCK: 25, BOND: 25, REAL_ESTATE: 0, CASH: 25, ETC: 25 },
  },
  {
    id: 'ALL_STOCK',
    name: '주식 100%',
    tagline: '최대 성장 추구',
    description:
      '전액 주식. 장기 기대수익은 가장 높지만 변동성과 낙폭도 가장 크다.',
    allocations: { STOCK: 100, BOND: 0, REAL_ESTATE: 0, CASH: 0, ETC: 0 },
  },
  {
    id: 'CUSTOM',
    name: '직접 입력',
    tagline: '원하는 목표 비중을 직접 설정',
    description:
      '자산군별 목표 비중을 직접 입력해(합 100%) 나만의 기준으로 진단합니다.',
  },
];

export function getTemplate(id: TemplateId): PortfolioTemplate | undefined {
  return PORTFOLIO_TEMPLATES.find((t) => t.id === id);
}
