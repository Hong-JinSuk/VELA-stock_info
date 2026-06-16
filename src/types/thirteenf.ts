/**
 * 13F filing 관련 타입 (WhaleWisdom 스타일 벤치마킹).
 */

import type { PaginatedResponse } from '@/lib/api/pagination';

// 리스트 행의 리치 요약 컬럼 (ThirteenFSummary Json 컬럼들의 항목 타입).
export type ThirteenFTopSector = { sector: string; weightPercent: number };
export type ThirteenFTopHolding = {
  ticker: string | null;
  name: string;
  weightPercent: number;
};
export type ThirteenFTopTrade = {
  ticker: string | null;
  name: string;
  tradeUsd: number; // 매수 +, 매도 -
};

// ThirteenFSummary(분기 박제) + AUM 시계열을 합친 리스트 행 요약.
// summary 배치가 채운 filer만 존재 → 없으면 ThirteenFListItem.summary = null.
export type ThirteenFListSummary = {
  aumUsd: number; // 표지 총가치 (BigInt → number, 안전 범위)
  qoqPercent: number | null; // 직전 분기 AUM 대비 %. 없으면 null
  holdingCount: number;
  topSectors: ThirteenFTopSector[];
  topHoldings: ThirteenFTopHolding[];
  topBuys: ThirteenFTopTrade[];
  topSells: ThirteenFTopTrade[];
  trend: number[]; // 분기별 aumUsd (오름차순). sparkline용
};

// 리스트 페이지의 한 줄 = 한 13F filer (최신 filing의 accession만 노출).
// form.idx 기반 batch라 formType/periodEnding/bizLocation은 알 수 없어 옵셔널.
export type ThirteenFListItem = {
  accession: string; // 최신 13F-HR의 accession ("0001067983-25-001234")
  cik: string; // padded "0001067983"
  filerName: string; // "BERKSHIRE HATHAWAY INC"
  krName?: string | null; // 한국어 매니저명 (ThirteenFFiler.krName, 수동 매핑이라 없을 수 있음)
  fileDate: string; // "YYYY-MM-DD" (마지막 13F-HR 접수일)
  formType?: string;
  periodEnding?: string;
  bizLocation?: string | null;
  // ThirteenFSummary LEFT JOIN 결과. summary 없는 filer는 null.
  summary?: ThirteenFListSummary | null;
  // summary가 최신 분기 것이 아닐 때 그 summary의 periodEnding ("YYYY-MM-DD").
  // 보고를 중단했거나 늦게 내는 filer의 "마지막 데이터"를 분기 라벨과 함께 보여주는 용도.
  summaryAsOf?: string | null;
};

// 페이지네이션된 검색 결과 (표준 PaginatedResponse 형태).
// total은 검색 결과 총 건수. page/size가 -1이면 페이지네이션 안 한 응답.
export type ThirteenFListResponse = PaginatedResponse<ThirteenFListItem>;

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
  // 비밀유지(confidential treatment) 신청으로 종목 명세가 비공개인 filing.
  // 보유명세 테이블은 placeholder(value 0)지만 표지 신고총액은 존재 → 아래 reported* 로 표시.
  holdingsWithheld: boolean;
  reportedValueUsd: number | null; // 표지 tableValueTotal (명세 비공개 시 안내용)
  reportedEntryCount: number | null; // 표지 tableEntryTotal (신고 종목 수)
};

// 이전 분기 대비 변동 row.
export type ThirteenFChangeRow = {
  cusip: string;
  ticker: string | null;
  nameOfIssuer: string;
  putCall: 'Put' | 'Call' | null; // 옵션 포지션 구분 (보통주는 null). 같은 종목도 옵션종류별 별도 행
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
  // 대형 filer(예: JP모건 7천여 종목) payload 방지를 위해 각 배열은 상위 N개로 cap.
  // 진짜 전체 개수는 *Count 필드로 별도 제공 (화면의 "N건" 표시용).
  buys: ThirteenFChangeRow[]; // delta > 0, delta value desc (상위 N개)
  sells: ThirteenFChangeRow[]; // delta < 0, delta value asc (상위 N개)
  holds: ThirteenFChangeRow[]; // 현재 보유, currentValueUsd desc (상위 N개)
  buysCount: number; // delta > 0 종목 전체 수
  sellsCount: number; // delta < 0 종목 전체 수
  holdsCount: number; // 현재 보유 종목 전체 수
  // 현재 분기가 비밀유지로 명세 비공개인 경우 (buys/sells/holds는 비어 있음).
  holdingsWithheld: boolean;
  reportedValueUsd: number | null; // 표지 신고총액
  reportedEntryCount: number | null; // 표지 신고 종목 수
};
