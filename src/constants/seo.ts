/**
 * SEO 공통 상수. 사이트 주소·설명·키워드의 단일 소스.
 *
 * 배포 주소는 `NEXT_PUBLIC_SITE_URL` 하나로만 바꾼다. 하위 경로에 배포하는 경우
 * (예: https://example.com/vela) 그 경로까지 포함해 넣으면 canonical/OG/sitemap이
 * 전부 따라온다. metadataBase가 base path를 지원한다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_NAME = 'VELA';

export const SITE_TITLE = 'VELA — 시장의 신호만 남기는 주식 인사이트';

export const SITE_DESCRIPTION =
  'VELA는 방대한 시장 데이터에서 의사결정에 필요한 신호만 골라 전달합니다. 13F 기관 보유 현황, 시장·섹터 지표, 종목 적정주가와 상승여력을 한 화면에서 확인하세요.';

export const SITE_KEYWORDS = [
  '주식',
  '미국주식',
  '주식 정보',
  '투자 인사이트',
  '13F',
  '기관 보유 현황',
  '섹터 분석',
  '시장 지표',
  '적정주가',
  '밸류에이션',
  'VELA',
];

/** 서비스 문의/운영 주체 이메일 (구조화 데이터·연락처 노출용). */
export const SITE_CONTACT_EMAIL = 'realtone98@gmail.com';

/** 상대 경로를 배포 주소 기준 절대 URL로. */
export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
