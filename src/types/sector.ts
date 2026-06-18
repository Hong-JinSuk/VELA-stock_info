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

// 임의 ETF 기간 성과 (섹터 분석 ETF 테이블용). Yahoo 일봉에서 계산.
// 기간 키는 EtfPeriodKey(d1·w1·m1·m3·m6·ytd·y1) — 섹터 지표보다 6달/1년이 더 있다.
export type { EtfPeriodKey } from '@/lib/market/period-returns';
export type EtfPerformance = {
  symbol: string;
  price: number | null;
  returns: Record<
    import('@/lib/market/period-returns').EtfPeriodKey,
    number | null
  >;
  trend: number[];
};
