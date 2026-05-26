/**
 * 13F filing 관련 타입 (WhaleWisdom 스타일 벤치마킹).
 */

// 리스트 페이지의 한 줄 = 한 13F filer (최신 filing의 accession만 노출).
// form.idx 기반 batch라 formType/periodEnding/bizLocation은 알 수 없어 옵셔널.
export type ThirteenFListItem = {
  accession: string; // 최신 13F-HR의 accession ("0001067983-25-001234")
  cik: string; // padded "0001067983"
  filerName: string; // "BERKSHIRE HATHAWAY INC"
  fileDate: string; // "YYYY-MM-DD" (마지막 13F-HR 접수일)
  formType?: string;
  periodEnding?: string;
  bizLocation?: string | null;
};

// 페이지네이션된 검색 결과.
export type ThirteenFListResponse = {
  items: ThirteenFListItem[];
  total: number; // 검색 결과 총 건수 (SEC가 10000으로 capped)
  page: number; // 1-based
  pageSize: number;
};

// 한 보유 종목 (infoTable의 한 row).
export type ThirteenFHolding = {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  ticker: string | null; // OpenFIGI로 CUSIP→ticker 매핑. 미상장/매핑 실패 시 null
  valueUsd: number; // 시장가치 (달러). SEC raw는 천 단위라 환산해서 저장.
  shares: number; // sshPrnamt
  sharesType: 'SH' | 'PRN'; // SH = 주식, PRN = 원금
  putCall: 'Put' | 'Call' | null;
  weightPercent: number; // 포트폴리오 내 비중 (%)
};

// Detail 페이지 응답 = filing 메타 + holdings + 집계.
export type ThirteenFDetail = {
  accession: string;
  cik: string;
  filerName: string;
  formType: string;
  fileDate: string;
  periodEnding: string;
  totalValueUsd: number; // 모든 holding의 가치 합
  holdingCount: number;
  topHoldingName: string | null;
  topHoldingWeight: number | null; // 1위 종목 비중
  holdings: ThirteenFHolding[];
};

// 이전 분기 대비 변동 row.
export type ThirteenFChangeRow = {
  cusip: string;
  ticker: string | null;
  nameOfIssuer: string;
  previousValueUsd: number; // 이전 분기 가치 (없으면 0 = 신규 매수)
  currentValueUsd: number; // 현재 분기 가치 (없으면 0 = 완전 매도)
  deltaValueUsd: number; // current - previous
  deltaPercent: number | null; // (current - previous) / previous * 100. previous=0이면 null(신규)
  weightPercent: number; // 현재 분기 비중 (현재 portfolio 기준). 완전 매도는 0
};

export type ThirteenFComparison = {
  current: {
    accession: string;
    fileDate: string;
    periodEnding: string;
  };
  previous: {
    accession: string;
    fileDate: string;
    periodEnding: string;
  } | null;
  filerName: string;
  cik: string;
  // 클라이언트에서 자유롭게 slice/페이지네이션 가능하도록 전체 정렬된 배열 반환.
  buys: ThirteenFChangeRow[]; // delta > 0 인 모든 종목, delta value desc
  sells: ThirteenFChangeRow[]; // delta < 0 인 모든 종목, delta value asc (가장 negative 먼저)
  holds: ThirteenFChangeRow[]; // 현재 보유 중인 모든 종목, currentValueUsd desc
};
