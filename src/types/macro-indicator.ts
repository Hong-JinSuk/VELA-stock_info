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
  relationIcon1: string;
  relationText1: string;
  relationIcon2: string;
  relationText2: string;
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
