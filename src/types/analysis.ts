import type { StockReportItem } from './stocks-report';

// 섹터 분석 목록 1건 (조회용).
export type AnalysisSectorListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  itemCount: number;
};

// 개별 종목 행 — 적정주가 + 펼침 상세(성장성/수익성). 산정방식(formula)은 비공개이나
// 성장률·ROA·52주최고 같은 표시용 펀더멘털은 펼침 패널에 노출한다.
export type AnalysisSectorStockRow = StockReportItem & {
  kind: 'STOCK';
  note: string | null; // ADMIN이 적은 항목 설명
  growthPct: number | null; // 성장성: 적정PER에 쓴 EPS 성장률(%)
  growthSource: string | null; // 'EPS_TTM' | 'EPS_3Y' | 'EPS_5Y'
  high52w: number | null; // 52주 최고가(참고)
};

// ETF 행 — 적정주가 추정 불가 → 펼치면 13F식 보유종목(EtfHoldingsCard).
export type AnalysisSectorEtfRow = {
  kind: 'ETF';
  symbol: string;
  name: string;
  note: string | null; // ADMIN이 적은 항목 설명
};

export type AnalysisSectorRow = AnalysisSectorStockRow | AnalysisSectorEtfRow;

// 섹터에서 중요한 지표 (조회용) — 이름 + 왜 중요한가 + 선택 링크(인앱/외부) + 선택 차트 키.
export type SectorIndicator = {
  id: string;
  name: string;
  description: string;
  link: string | null;
  seriesKey: string | null; // 차트형 시계열 키. null이면 텍스트만.
};

// 섹터 분석 상세 (조회용) — 종목/ETF를 sortOrder 순서로 섞은 통합 목록(행 펼침).
export type AnalysisSectorDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  items: AnalysisSectorRow[];
  indicators: SectorIndicator[];
};

// 관리(ADMIN)용 — note/sortOrder 포함, valuation은 불필요.
export type AdminSectorItem = {
  id: string;
  symbol: string;
  note: string | null;
  sortOrder: number;
};

// 관리(ADMIN)용 중요 지표.
export type AdminSectorIndicator = {
  id: string;
  name: string;
  description: string;
  link: string | null;
  seriesKey: string | null;
  sortOrder: number;
};

export type AdminSector = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: AdminSectorItem[];
  indicators: AdminSectorIndicator[];
};
