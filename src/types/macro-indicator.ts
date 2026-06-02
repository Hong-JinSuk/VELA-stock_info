export type IndicatorState = {
  icon: string;
  label: string;
  resultIcon: string;
  resultLabel: string;
};

// 발표일 당일 release timeline UI에서 시그널 강도를 분류하는 임계값.
// gemini-server catalog의 SignalThresholds와 동일 구조.
export type SignalThresholdUnit =
  | 'mom_pct'
  | 'qoq_pct'
  | 'abs_change'
  | 'abs_pp'
  | 'level_change';

export type SignalThresholds = {
  unit: SignalThresholdUnit;
  notable: number;
  clear: number;
};

export type IndicatorDisplayMeta = {
  cardName: string; // 카드 헤더에 표시되는 한국어 이름 (gemini-server에서 indicator.name 자동 주입)
  iconName: string;
  description: string;
  marketImpact: string;
  valueDecimals: number;
  unitSuffix: string;
  thresholdGood?: number;
  thresholdBad?: number;
  invertThreshold?: boolean;
  trendGood?: number;
  trendBad?: number;
  invertTrend?: boolean;
  signalThresholds?: SignalThresholds;
  states: {
    good?: IndicatorState;
    neutral: IndicatorState;
    bad?: IndicatorState;
  };
};

// catalog 발표 주기. UI 필터(매일/실시간/분기 등) 용도.
export type IndicatorFrequency =
  | 'realtime'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'event';

// catalog category. UI 그룹핑 용도.
export type IndicatorCategory = string;

export type MacroIndicator = {
  indicatorId: string;
  source: string;
  frequency: IndicatorFrequency;
  category: IndicatorCategory | null;
  observationDate: string | null;
  value: number;
  previousValue: number | null;
  prevPreviousValue: number | null; // 전전 발표 데이터 (scheduled 지표 발표일 당일 표시용)
  change: number | null;
  changePercent: number | null;
  displayMeta: IndicatorDisplayMeta;
  nextReleaseDate: string | null; // "YYYY-MM-DD" | null
  releasedAt: string | null; // ISO timestamp. scheduled 지표 마지막 release 시각.
  updatedAt: string;
};
