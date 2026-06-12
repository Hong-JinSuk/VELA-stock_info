/**
 * 섹터 지표 페이지의 ETF 고정 세트.
 *
 *  - sector: GICS 11개 섹터 (SPDR Select Sector, XL 시리즈) — S&P 500을 빠짐없이
 *    분할하는 표준 세트라 섹터 로테이션 비교의 베이스.
 *  - industry: 한 단계 깊은 산업/테마 ETF 선별 (반도체 SOXX처럼 섹터보다 좁은 단위).
 *
 * sector 필드는 src/constants/sector-colors.ts의 색 매핑 키와 일치해야 한다.
 */
export type SectorEtfGroup = 'sector' | 'industry';

export type SectorEtf = {
  ticker: string;
  nameKo: string;
  sector: string;
  group: SectorEtfGroup;
};

export const SECTOR_ETFS: SectorEtf[] = [
  // GICS 11개 섹터
  { ticker: 'XLK', nameKo: '기술', sector: 'Technology', group: 'sector' },
  { ticker: 'XLF', nameKo: '금융', sector: 'Financials', group: 'sector' },
  { ticker: 'XLV', nameKo: '헬스케어', sector: 'Health Care', group: 'sector' },
  { ticker: 'XLY', nameKo: '경기소비재', sector: 'Consumer Discretionary', group: 'sector' },
  { ticker: 'XLP', nameKo: '필수소비재', sector: 'Consumer Staples', group: 'sector' },
  { ticker: 'XLC', nameKo: '커뮤니케이션', sector: 'Communication Services', group: 'sector' },
  { ticker: 'XLI', nameKo: '산업재', sector: 'Industrials', group: 'sector' },
  { ticker: 'XLE', nameKo: '에너지', sector: 'Energy', group: 'sector' },
  { ticker: 'XLB', nameKo: '소재', sector: 'Materials', group: 'sector' },
  { ticker: 'XLU', nameKo: '유틸리티', sector: 'Utilities', group: 'sector' },
  { ticker: 'XLRE', nameKo: '리츠', sector: 'Real Estate', group: 'sector' },
  // 산업 / 테마 (선별)
  { ticker: 'SOXX', nameKo: '반도체', sector: 'Technology', group: 'industry' },
  { ticker: 'SMH', nameKo: '반도체 (대형)', sector: 'Technology', group: 'industry' },
  { ticker: 'XBI', nameKo: '바이오', sector: 'Health Care', group: 'industry' },
  { ticker: 'KRE', nameKo: '지역은행', sector: 'Financials', group: 'industry' },
  { ticker: 'ITA', nameKo: '방산·항공우주', sector: 'Industrials', group: 'industry' },
  { ticker: 'XHB', nameKo: '주택건설', sector: 'Consumer Discretionary', group: 'industry' },
];
