import type { StockReportStatus } from '@/types/stocks-report';

// 적정주가 관리(admin) 목록 한 행 — StockValuation 스냅샷 + 수동 조정 성장률.
export type AdminValuationItem = {
  symbol: string;
  name: string;
  price: number | null; // 스냅샷 전(PENDING)이면 null
  growthPct: number | null; // 실제 사용된 성장률(%) — 조정값이 있으면 그 값
  growthOverride: number | null; // 수동 조정 성장률(%) — 비어있으면 자동
  growthSource: string; // 'MANUAL' | 'EPS_TTM' | ...
  fairValue: number | null;
  upsidePct: number | null;
  status: StockReportStatus;
  snapshotAt: string | null;
};

// 섹터별로 묶은 적정주가 조정 목록. ETF 제외. 섹터 미지정(즐겨찾기 등)은 sectorId=null 그룹.
export type AdminValuationSectorGroup = {
  sectorId: string | null;
  sectorName: string;
  slug: string | null;
  items: AdminValuationItem[];
};
