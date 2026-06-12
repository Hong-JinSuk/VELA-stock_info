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

// 5단계 상태 경계 (gemini-server catalog의 IndicatorBands와 동일 구조).
// invert=false: 낮을수록 좋음 (v ≤ veryGood → 매우 좋음, v ≥ veryBad → 매우 안좋음)
// invert=true: 높을수록 좋음 (비교 방향 반전)
export type IndicatorBands = {
  veryGood: number;
  good: number;
  bad: number;
  veryBad: number;
};

export type IndicatorDisplayMeta = {
  cardName: string; // 카드 헤더에 표시되는 한국어 이름 (gemini-server에서 indicator.name 자동 주입)
  iconName: string;
  description: string;
  marketImpact: string;
  valueDecimals: number;
  unitSuffix: string;
  // 5단계 경계. thresholds = value 기준, trends = changePercent 기준 (trends 우선).
  thresholds?: IndicatorBands;
  invertThreshold?: boolean;
  trends?: IndicatorBands;
  invertTrend?: boolean;
  // ---- 구버전(3단계) 호환 필드 ----
  // 다음 indicator-snapshot 배치가 5단계 meta로 갱신하기 전까지 DB에 남아있을 수 있음.
  thresholdGood?: number;
  thresholdBad?: number;
  trendGood?: number;
  trendBad?: number;
  signalThresholds?: SignalThresholds;
  states: {
    veryGood?: IndicatorState;
    good?: IndicatorState;
    neutral: IndicatorState;
    bad?: IndicatorState;
    veryBad?: IndicatorState;
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
