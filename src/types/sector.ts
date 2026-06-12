/**
 * 섹터 지표 페이지 (섹터/산업 ETF 기간별 성과) 타입.
 */

import type { SectorEtfGroup } from '@/constants/sector-etfs';

export type SectorPeriodKey = 'd1' | 'w1' | 'm1' | 'm3' | 'ytd';

export type SectorPerformance = {
  ticker: string;
  nameKo: string;
  sector: string; // sector-colors 색 매핑 키
  group: SectorEtfGroup;
  price: number; // 마지막 종가
  // 기간별 수익률(%). 데이터 부족(상장 1년 미만 등)이면 null.
  returns: Record<SectorPeriodKey, number | null>;
  trend: number[]; // 최근 종가 시계열 (sparkline용)
};
