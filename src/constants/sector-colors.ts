/**
 * 섹터별 고정 색. 서비스 전체(13F 주요 섹터, 섹터 지표 페이지 등)에서 공유해
 * "같은 섹터 = 같은 색"을 보장한다.
 *
 * 키 구성:
 *  - gemini-server sector-bucket.ts의 10개 버킷 (13F summary가 쓰는 이름)
 *  - GICS 11개 섹터 (섹터 ETF 페이지) — 13F 버킷 'Consumer'는 GICS에서
 *    Discretionary/Staples로 갈라지므로 두 키를 추가로 둔다.
 */
export const SECTOR_COLOR_BY_NAME: Record<string, string> = {
  Technology: 'bg-blue-500',
  Financials: 'bg-emerald-500',
  'Health Care': 'bg-rose-500',
  Consumer: 'bg-amber-500',
  'Consumer Discretionary': 'bg-amber-500',
  'Consumer Staples': 'bg-lime-500',
  'Communication Services': 'bg-violet-500',
  Industrials: 'bg-slate-500',
  Energy: 'bg-orange-500',
  Materials: 'bg-teal-500',
  Utilities: 'bg-yellow-400',
  'Real Estate': 'bg-cyan-500',
};

// 매핑에 없는 섹터(버킷 확장 등)용 fallback.
export const SECTOR_COLOR_FALLBACK = 'bg-zinc-400';

export function sectorColor(sector: string): string {
  return SECTOR_COLOR_BY_NAME[sector] ?? SECTOR_COLOR_FALLBACK;
}
