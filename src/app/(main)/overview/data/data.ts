import {
  Activity,
  AlertTriangle,
  Coins,
  Gauge,
  Scale,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';

export type Status = 'Good' | 'Neutral' | 'Bad';

export type Indicator = {
  id: string;
  name: string;
  icon: React.ElementType;
  valueMain: string;
  valueSuffix: string;
  status: Status;
  description: string;
  marketImpact: string;
  relationIcon1: string;
  relationText1: string;
  relationIcon2: string;
  relationText2: string;
};

export const MACRO_INDICATORS: Indicator[] = [
  {
    id: 'vix',
    name: 'VIX (공포지수)',
    icon: Activity,
    valueMain: '18',
    valueSuffix: '.5',
    status: 'Neutral',
    description: '"시장의 공포탄" - 지수 급등 시 주가 급락 위험.',
    marketImpact:
      '지수가 높을수록 시장의 불확실성과 변동성이 커짐을 의미하므로 주가 하락 압력으로 작용.',
    relationIcon1: '📉',
    relationText1: 'VIX 안정화',
    relationIcon2: '📈',
    relationText2: '투자심리 회복',
  },
  {
    id: 'treasury-10y',
    name: '미국 10년물 국채금리',
    icon: TrendingUp,
    valueMain: '4',
    valueSuffix: '.25%',
    status: 'Bad',
    description:
      '"주식의 라이벌" - 금리 상승 시 기술주 및 성장주 밸류에이션 하락.',
    marketImpact:
      '무위험 자산인 국채의 수익률이 오르면, 투자자들이 위험자산인 주식 대신 채권으로 자금을 이동시킵니다.',
    relationIcon1: '📈',
    relationText1: '금리 상승 시',
    relationIcon2: '📉',
    relationText2: '기술주 밸류 하락',
  },
  {
    id: 'dollar-index',
    name: '달러 인덱스',
    icon: Coins,
    valueMain: '104',
    valueSuffix: '.2',
    status: 'Neutral',
    description:
      '"글로벌 돈의 가치" - 달러 강세 시 미국 대형 수출주 실적 악화.',
    marketImpact:
      '다른 통화 대비 달러 가치가 오르면 미국 다국적 기업의 수출 경쟁력과 장부상 환산 이익이 감소합니다.',
    relationIcon1: '📉',
    relationText1: '달러 약세 시',
    relationIcon2: '📈',
    relationText2: '수출주 실적 개선',
  },
  {
    id: 'high-yield-spread',
    name: '하이일드 채권 스프레드',
    icon: AlertTriangle,
    valueMain: '3',
    valueSuffix: '.8%',
    status: 'Good',
    description: '"기업 부도 위험" - 격차 확대 시 경기 침체 및 투매 주의.',
    marketImpact:
      '우량 채권 대비 투기 등급 채권의 금리 격차로, 확대 시 기업의 디폴트(채무불이행) 위험이 상승함을 의미합니다.',
    relationIcon1: '📉',
    relationText1: '스프레드 축소',
    relationIcon2: '🛡️',
    relationText2: '신용 리스크 완화',
  },
  {
    id: 'fear-greed',
    name: '공포탐욕지수',
    icon: Gauge,
    valueMain: '65',
    valueSuffix: '(탐욕)',
    status: 'Neutral',
    description:
      '"투자자 심리" - 극도의 탐욕(매도 경계), 극도의 공포(매수 기회).',
    marketImpact:
      '시장 참여자들의 비이성적 감정을 측정. 극도의 탐욕 상태는 단기적 조정 위험 가능성이 높습니다.',
    relationIcon1: '⚖️',
    relationText1: '적정 심리 유지 시',
    relationIcon2: '📈',
    relationText2: '증시 자금 유입',
  },
  {
    id: 'cpi',
    name: 'CPI (소비자물가지수)',
    icon: ShoppingCart,
    valueMain: '3',
    valueSuffix: '.2% YoY',
    status: 'Bad',
    description:
      '"물가 성적표" - 예상보다 높으면 금리 인상 압박으로 주가 하락.',
    marketImpact:
      '인플레이션이 진정되지 않으면 연준의 고금리 정책이 길게 유지되어 주식 시장 밸류에이션에 큰 부담을 줍니다.',
    relationIcon1: '📈',
    relationText1: '예상치 상회 시',
    relationIcon2: '📉',
    relationText2: '하락 압력 심화',
  },
  {
    id: 'employment',
    name: '미국 실업률',
    icon: Users,
    valueMain: '3',
    valueSuffix: '.8%',
    status: 'Neutral',
    description:
      '"경제의 체력" - 급격한 실업률 상승은 경기 침체(Recession) 신호.',
    marketImpact:
      '실업률이 이전 사이클 저점 대비 일정 기준 이상 가파르게 오르면 샴 법칙(Sahm Rule)이 발동되며 침체 공포를 더합니다.',
    relationIcon1: '📊',
    relationText1: '완만한 고용 둔화',
    relationIcon2: '🎯',
    relationText2: '골디락스 장세',
  },
  {
    id: 'buffett-indicator',
    name: '버핏지수',
    icon: Scale,
    valueMain: '185',
    valueSuffix: '%',
    status: 'Bad',
    description:
      '"증시 가격표" - GDP 대비 시총 비중. 150% 이상 시 역사적 고평가(비쌈).',
    marketImpact:
      '미국 거시 경제 규모(GDP) 파이에 대비해 주식 시장의 시가총액이 어느정도인지 측정하여 전반적인 거품을 판단합니다.',
    relationIcon1: '📈',
    relationText1: '150% 초과 시',
    relationIcon2: '⚠️',
    relationText2: '장기 기대수익률 하락',
  },
];
