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

export type MacroIndicator = {
  indicatorId: string;
  source: string;
  frequency: 'realtime' | 'daily';
  dateKey: string;
  observationDate: string | null;
  value: number;
  previousValue: number | null;
  change: number | null;
  changePercent: number | null;
  displayMeta: IndicatorDisplayMeta;
  nextReleaseDate: string | null; // "YYYY-MM-DD" | null
  updatedAt: string;
};
