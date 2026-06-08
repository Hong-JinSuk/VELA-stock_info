// Finnhub 기반 개별 종목 조회 타입.
// 모든 외부 호출은 서버사이드(src/lib/api/finnhub.ts)에서만 일어나고,
// 클라는 우리 /api/stock/* route를 통해 이 정규화된 타입만 받는다.

export type StockSearchItem = {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
};

export type StockQuote = {
  current: number; // 현재가 (c)
  change: number; // 전일 대비 (d)
  percentChange: number; // 전일 대비 % (dp)
  high: number; // 당일 고가 (h)
  low: number; // 당일 저가 (l)
  open: number; // 시가 (o)
  previousClose: number; // 전일 종가 (pc)
};

export type StockProfile = {
  name: string;
  ticker: string;
  exchange: string;
  industry: string;
  logo: string;
  weburl: string;
  currency: string;
  marketCap: number | null; // 시가총액 (백만 단위, Finnhub 원본)
  country: string;
};

// 카드 "주요 지표" 영역. 값이 없으면 null → UI에서 "–" 표시.
export type StockMetrics = {
  high52w: number | null;
  low52w: number | null;
  priceReturn52w: number | null;
  dividendYield: number | null;
  peAnnual: number | null;
  pbAnnual: number | null;
  psAnnual: number | null;
  epsAnnual: number | null;
  beta: number | null;
  revenueGrowthTTM: number | null;
  operatingMarginTTM: number | null;
  netMarginTTM: number | null;
  roiTTM: number | null;
  roeTTM: number | null;
  currentRatioQuarterly: number | null;
};

export type AnalystRecommendation = {
  period: string; // 기준일 YYYY-MM-DD
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  total: number;
};

export type StockDetail = {
  profile: StockProfile;
  quote: StockQuote;
  metrics: StockMetrics;
  recommendation: AnalystRecommendation | null;
};

// 6개월 일봉 차트용.
export type StockCandlePoint = { date: string; close: number };

// ---- 내부자 거래 분석 ----

// 취득(물량 증가) 3 + 처분(물량 감소) 3 버킷. 단위: 주식 수.
export type InsiderBuckets = {
  openMarketBuy: number; // 자발적 매수 (code P)
  awardGrant: number; // 보상/옵션 수령 (A, M)
  otherAcquisition: number; // 기타 취득
  openMarketSell: number; // 자발적 매도 (code S)
  taxOption: number; // 세금/옵션비용 (code F)
  otherDisposition: number; // 기타 처분
};

// 월별 신호 물량 (최근 12개월, 차트용). 신호(P 매수 / S 매도) vs 중립 분리.
export type InsiderMonthlyPoint = {
  month: string; // YYYY-MM
  buy: number; // 공개시장 매수 (P, shares)
  sell: number; // 공개시장 매도 (S, shares)
  neutral: number; // 보상·세금·증여 등 비신호 (shares)
};

export type InsiderAnalysis = {
  hasData: boolean;
  buckets: InsiderBuckets;
  monthly: InsiderMonthlyPoint[]; // 길이 12 (오래된→최신)
  totalAcquired: number;
  totalDisposed: number;
};

export type StockNewsItem = {
  source: string;
  headline: string;
  summary: string;
  url: string;
  image: string | null;
  datetime: string; // ISO
  lang: 'en' | 'ko';
};
