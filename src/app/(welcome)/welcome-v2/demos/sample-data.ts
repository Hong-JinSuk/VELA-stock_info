/**
 * welcome-v2 제품 데모용 큐레이션 샘플 데이터.
 *
 * 실제 라이브 데이터(useMacroIndicators / useThirteenFList / useStockCandle)를 쓰지 않고,
 * "대표적으로 보기 좋은 한 장면"을 고정 데이터로 연출한다.
 * 실제 컴포넌트(MacroCard, DataTable+13F 컬럼, Sparkline)를 그대로 재사용하므로
 * 디자인이 바뀌면 데모도 자동으로 같이 갱신된다.
 */

import type { MacroIndicator } from '@/types/macro-indicator';
import type { ThirteenFListItem } from '@/types/thirteenf';

// 보일러플레이트 필드를 채워주는 헬퍼. value/displayMeta 등 핵심만 넘기면 된다.
function makeIndicator(
  partial: Pick<MacroIndicator, 'indicatorId' | 'value' | 'displayMeta'> &
    Partial<MacroIndicator>,
): MacroIndicator {
  return {
    source: 'fred',
    frequency: 'monthly',
    category: null,
    observationDate: '2026-06-01',
    previousValue: partial.value,
    prevPreviousValue: null,
    change: null,
    changePercent: null,
    nextReleaseDate: null,
    releasedAt: null,
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...partial,
  };
}

// 4개 지표 — 상태(색)가 골고루 퍼지도록 구성 (VeryGood / Good / Neutral / Bad).
export const SAMPLE_INDICATORS: MacroIndicator[] = [
  makeIndicator({
    indicatorId: 'cpi_core',
    category: 'inflation',
    value: 3.1,
    previousValue: 3.3,
    changePercent: -6.1,
    nextReleaseDate: '2026-06-17',
    displayMeta: {
      cardName: '근원 CPI',
      iconName: 'Flame',
      description: '추세 인플레 - 식료품·에너지를 제외한 핵심 물가.',
      marketImpact:
        '근원 CPI가 끈끈하면 정책금리 인하 기대가 늦춰져 위험자산에 부담이 됩니다.',
      valueDecimals: 1,
      unitSuffix: '%',
      thresholds: { veryGood: 2.0, good: 2.5, bad: 3.0, veryBad: 4.0 },
      states: {
        veryGood: { icon: '🧊', label: '물가 안정', resultIcon: '🕊️', resultLabel: '인하 여력' },
        good: { icon: '🙂', label: '둔화', resultIcon: '🛡️', resultLabel: '목표 근접' },
        neutral: { icon: '🎯', label: '보합', resultIcon: '⚖️', resultLabel: '관망' },
        bad: { icon: '🔥', label: '끈적한 물가', resultIcon: '⏳', resultLabel: '인하 지연' },
        veryBad: { icon: '🌋', label: '과열', resultIcon: '🚨', resultLabel: '긴축 압박' },
      },
    },
  }),
  makeIndicator({
    indicatorId: 'fed_funds',
    category: 'rates',
    frequency: 'daily',
    value: 3.62,
    previousValue: 3.62,
    displayMeta: {
      cardName: '연방기금 실효금리',
      iconName: 'Landmark',
      description: '연준의 핸들 - 정책금리 수준이 시장의 할인율을 결정.',
      marketImpact: '연방기금금리는 모든 자산의 기준이 되는 무위험 단기 수익률입니다.',
      valueDecimals: 2,
      unitSuffix: '%',
      thresholds: { veryGood: 2.0, good: 2.5, bad: 5.0, veryBad: 5.5 },
      states: {
        veryGood: { icon: '🌿', label: '완화적', resultIcon: '🚀', resultLabel: '유동성 ↑' },
        good: { icon: '🙂', label: '중립 이하', resultIcon: '💧', resultLabel: '우호적' },
        neutral: { icon: '⚖️', label: '중립 수준', resultIcon: '🎯', resultLabel: '균형' },
        bad: { icon: '🧱', label: '긴축적', resultIcon: '🥶', resultLabel: '할인율 ↑' },
        veryBad: { icon: '⛓️', label: '강한 긴축', resultIcon: '🚨', resultLabel: '자산 역풍' },
      },
    },
  }),
  makeIndicator({
    indicatorId: 'unemployment',
    category: 'employment',
    value: 4.1,
    previousValue: 4.2,
    changePercent: -2.4,
    nextReleaseDate: '2026-07-03',
    displayMeta: {
      cardName: '미국 실업률 (U-3)',
      iconName: 'Users',
      description: '고용의 체온계 - 노동시장 건강을 보는 공식 실업률.',
      marketImpact: '실업률이 낮으면 소비 여력이 유지되지만, 과열되면 임금 인플레 우려가 커집니다.',
      valueDecimals: 1,
      unitSuffix: '%',
      thresholds: { veryGood: 3.5, good: 4.2, bad: 5.0, veryBad: 6.0 },
      states: {
        veryGood: { icon: '💪', label: '완전고용', resultIcon: '🛍️', resultLabel: '소비 견조' },
        good: { icon: '🙂', label: '견조', resultIcon: '✅', resultLabel: '안정적' },
        neutral: { icon: '🎯', label: '보통', resultIcon: '⚖️', resultLabel: '관망' },
        bad: { icon: '📉', label: '둔화', resultIcon: '⚠️', resultLabel: '침체 신호' },
        veryBad: { icon: '🧊', label: '냉각', resultIcon: '🚨', resultLabel: '경기 위축' },
      },
    },
  }),
  makeIndicator({
    indicatorId: 'vix',
    category: 'sentiment',
    frequency: 'realtime',
    value: 14.2,
    previousValue: 16.8,
    changePercent: -15.5,
    displayMeta: {
      cardName: '변동성 지수 (VIX)',
      iconName: 'Activity',
      description: '시장의 공포계 - 낮을수록 안정, 급등은 위험회피 심리.',
      marketImpact: 'VIX가 낮으면 위험선호가 우세하고, 급등 시 헤지 수요와 변동성 확대를 의미합니다.',
      valueDecimals: 1,
      unitSuffix: '',
      thresholds: { veryGood: 15, good: 20, bad: 28, veryBad: 35 },
      states: {
        veryGood: { icon: '😌', label: '안정', resultIcon: '📈', resultLabel: '위험선호' },
        good: { icon: '🙂', label: '차분', resultIcon: '✅', resultLabel: '우호적' },
        neutral: { icon: '🎯', label: '보통', resultIcon: '⚖️', resultLabel: '관망' },
        bad: { icon: '😰', label: '불안', resultIcon: '🛡️', resultLabel: '헤지 수요' },
        veryBad: { icon: '😱', label: '공포', resultIcon: '🚨', resultLabel: '급락 위험' },
      },
    },
  }),
];

// 13F 데모용 4개 행 — 섹터 바·스파크라인·운용자산이 모두 채워지도록.
export const SAMPLE_13F: ThirteenFListItem[] = [
  {
    accession: '0001067983-26-000001',
    cik: '0001067983',
    filerName: 'BERKSHIRE HATHAWAY INC',
    krName: '버크셔 해서웨이',
    fileDate: '2026-05-15',
    periodEnding: '2026-03-31',
    summary: {
      aumUsd: 312_400_000_000,
      qoqPercent: 4.2,
      holdingCount: 38,
      topSectors: [
        { sector: 'Technology', weightPercent: 41 },
        { sector: 'Financials', weightPercent: 28 },
        { sector: 'Consumer', weightPercent: 16 },
        { sector: 'Energy', weightPercent: 9 },
      ],
      topHoldings: [
        { ticker: 'AAPL', name: 'Apple', weightPercent: 24 },
        { ticker: 'BAC', name: 'Bank of America', weightPercent: 11 },
        { ticker: 'KO', name: 'Coca-Cola', weightPercent: 9 },
      ],
      topBuys: [
        { ticker: 'OXY', name: 'Occidental', tradeUsd: 2_100_000_000 },
        { ticker: 'CVX', name: 'Chevron', tradeUsd: 1_300_000_000 },
      ],
      topSells: [
        { ticker: 'HPQ', name: 'HP', tradeUsd: -900_000_000 },
        { ticker: 'PARA', name: 'Paramount', tradeUsd: -420_000_000 },
      ],
      trend: [248, 256, 261, 275, 283, 290, 299, 305, 312],
    },
  },
  {
    accession: '0001364742-26-000002',
    cik: '0001364742',
    filerName: 'BLACKROCK INC.',
    krName: '블랙록',
    fileDate: '2026-05-14',
    periodEnding: '2026-03-31',
    summary: {
      aumUsd: 5_740_000_000_000,
      qoqPercent: 2.1,
      holdingCount: 5610,
      topSectors: [
        { sector: 'Technology', weightPercent: 32 },
        { sector: 'Financials', weightPercent: 18 },
        { sector: 'Health Care', weightPercent: 14 },
        { sector: 'Industrials', weightPercent: 11 },
      ],
      topHoldings: [
        { ticker: 'MSFT', name: 'Microsoft', weightPercent: 6 },
        { ticker: 'NVDA', name: 'NVIDIA', weightPercent: 6 },
        { ticker: 'AAPL', name: 'Apple', weightPercent: 5 },
      ],
      topBuys: [
        { ticker: 'NVDA', name: 'NVIDIA', tradeUsd: 8_900_000_000 },
        { ticker: 'AVGO', name: 'Broadcom', tradeUsd: 3_400_000_000 },
      ],
      topSells: [
        { ticker: 'TSLA', name: 'Tesla', tradeUsd: -2_700_000_000 },
        { ticker: 'INTC', name: 'Intel', tradeUsd: -1_100_000_000 },
      ],
      trend: [5320, 5380, 5410, 5470, 5520, 5590, 5650, 5700, 5740],
    },
  },
  {
    accession: '0001423053-26-000003',
    cik: '0001423053',
    filerName: 'CITADEL ADVISORS LLC',
    krName: '시타델',
    fileDate: '2026-05-15',
    periodEnding: '2026-03-31',
    summary: {
      aumUsd: 618_000_000_000,
      qoqPercent: -1.8,
      holdingCount: 4120,
      topSectors: [
        { sector: 'Technology', weightPercent: 27 },
        { sector: 'Health Care', weightPercent: 21 },
        { sector: 'Communication Services', weightPercent: 15 },
        { sector: 'Financials', weightPercent: 12 },
      ],
      topHoldings: [
        { ticker: 'NVDA', name: 'NVIDIA', weightPercent: 4 },
        { ticker: 'META', name: 'Meta', weightPercent: 3 },
        { ticker: 'AMZN', name: 'Amazon', weightPercent: 3 },
      ],
      topBuys: [
        { ticker: 'GOOGL', name: 'Alphabet', tradeUsd: 1_800_000_000 },
        { ticker: 'LLY', name: 'Eli Lilly', tradeUsd: 1_200_000_000 },
      ],
      topSells: [
        { ticker: 'AAPL', name: 'Apple', tradeUsd: -2_100_000_000 },
        { ticker: 'XOM', name: 'Exxon', tradeUsd: -640_000_000 },
      ],
      trend: [602, 611, 625, 631, 628, 622, 619, 620, 618],
    },
  },
  {
    accession: '0001037389-26-000004',
    cik: '0001037389',
    filerName: 'RENAISSANCE TECHNOLOGIES LLC',
    krName: '르네상스 테크놀로지스',
    fileDate: '2026-05-13',
    periodEnding: '2026-03-31',
    summary: {
      aumUsd: 64_200_000_000,
      qoqPercent: 6.7,
      holdingCount: 3480,
      topSectors: [
        { sector: 'Health Care', weightPercent: 23 },
        { sector: 'Technology', weightPercent: 20 },
        { sector: 'Consumer', weightPercent: 18 },
        { sector: 'Industrials', weightPercent: 13 },
      ],
      topHoldings: [
        { ticker: 'PLTR', name: 'Palantir', weightPercent: 2 },
        { ticker: 'VRTX', name: 'Vertex', weightPercent: 2 },
        { ticker: 'NVDA', name: 'NVIDIA', weightPercent: 2 },
      ],
      topBuys: [
        { ticker: 'PLTR', name: 'Palantir', tradeUsd: 720_000_000 },
        { ticker: 'UBER', name: 'Uber', tradeUsd: 510_000_000 },
      ],
      topSells: [
        { ticker: 'NFLX', name: 'Netflix', tradeUsd: -480_000_000 },
        { ticker: 'PEP', name: 'PepsiCo', tradeUsd: -300_000_000 },
      ],
      trend: [55, 57, 56, 59, 60, 61, 62, 63, 64],
    },
  },
];

// 종목 차트 데모용 일봉(close) 시계열 — 우상향 추세에 노이즈를 섞어 생성(결정적).
export type DemoCandle = { date: string; close: number };

export function buildSampleCandles(): DemoCandle[] {
  const out: DemoCandle[] = [];
  const start = new Date('2026-01-02');
  let price = 178;
  for (let i = 0; i < 120; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    // 결정적 의사난수(사인 합성) — 빌드마다 동일.
    const wave = Math.sin(i / 6) * 4 + Math.sin(i / 17) * 9;
    const drift = i * 0.42;
    price = 178 + drift + wave;
    out.push({ date: d.toISOString().slice(0, 10), close: Math.round(price * 100) / 100 });
  }
  return out;
}
