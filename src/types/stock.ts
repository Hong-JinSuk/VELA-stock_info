// Finnhub 기반 개별 종목 조회 타입.
// 모든 외부 호출은 서버사이드(src/lib/api/finnhub.ts)에서만 일어나고,
// 클라는 우리 /api/stock/* route를 통해 이 정규화된 타입만 받는다.

export type StockSearchItem = {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
  // 우리 StockSymbol 디렉터리에 존재하는지. false면 Finnhub 폴백 결과(상장폐지/미수록 등)로
  // 섹터·즐겨찾기처럼 DB 존재가 필요한 곳에선 추가 불가. (DB 결과는 항상 true)
  inDirectory?: boolean;
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

// 즐겨찾기 목록 등 여러 종목을 한 번에 가볍게 보여줄 때 쓰는 요약 시세.
// 상세(StockDetail)는 종목당 호출이 무거우므로, 이름 + 시세만 배치로 제공.
export type StockQuoteItem = {
  symbol: string;
  name: string;
  currency: string;
  current: number; // 현재가 (없으면 0)
  change: number; // 전일 대비
  percentChange: number; // 전일 대비 %
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
  isFund?: boolean; // ETF/펀드 — Finnhub 회사 프로필이 없어 StockSymbol로 fallback한 경우 true
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
  roaTTM: number | null;
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

// 애널리스트 목표주가 컨센서스 (Yahoo financialData). 차트의 목표가 팬에 사용.
export type PriceTarget = {
  mean: number; // 평균 목표가
  high: number; // 최고
  low: number; // 최저
  current: number; // 현재가 (Yahoo, USD)
  count: number; // 목표가 제시 애널리스트 수
};

export type StockDetail = {
  profile: StockProfile;
  quote: StockQuote;
  metrics: StockMetrics;
  recommendation: AnalystRecommendation | null;
  priceTarget: PriceTarget | null;
};

// 6개월 일봉 차트용.
export type StockCandlePoint = { date: string; close: number };

// 1일 인트라데이(5분봉) 미니 차트용.
export type StockIntradayPoint = { time: string; close: number };

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

// 즐겨찾기 행 펼치기용 묶음 — 1일 차트 + 애널리스트 의견 + 내부자 거래.
// 펼칠 때 한 번에 받아 추가 호출/네트워크 왕복을 줄인다.
export type StockSummary = {
  intraday: StockIntradayPoint[];
  recommendation: AnalystRecommendation | null;
  insider: InsiderAnalysis;
};

// ---- ETF 보유종목 (StockSymbolEtf / Yahoo topHoldings 기반) ----

export type EtfHoldingEntry = {
  rank: number;
  prevRank: number | null; // 직전 순위. null = 신규 진입 또는 최초 적재
  symbol: string | null;
  name: string; // 표시명 (한국어명 우선, 없으면 Yahoo 원본)
  weight: number; // 비중 0~1
};

export type EtfHoldingsData = {
  stockPct: number | null;
  bondPct: number | null;
  cashPct: number | null;
  entered: string[]; // 직전 대비 top-10 편입 심볼
  exited: string[]; // 편출 심볼
  holdings: EtfHoldingEntry[];
  updatedAt: string; // ISO
};

// ---- 실적 서프라이즈 (Finnhub /stock/earnings 기반) ----

// 분기별 예상 vs 실제 EPS. 시간순(오래된→최신)으로 정렬해 전달.
export type EarningsSurprisePoint = {
  period: string; // 분기말 YYYY-MM-DD
  label: string; // 표시용 라벨 (예: "26 Q2" — 회계연도/분기)
  estimate: number | null; // 예상(컨센서스) EPS
  actual: number | null; // 실제 EPS
  surprisePercent: number | null; // 서프라이즈 % (실제가 예상보다 얼마나)
  beat: boolean | null; // 예상 상회 여부 (actual >= estimate). 데이터 없으면 null
};

export type EarningsSurprise = {
  points: EarningsSurprisePoint[]; // 시간순(오래된→최신)
  beatCount: number; // 예상 상회 분기 수
  total: number; // 비교 가능한 분기 수
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
