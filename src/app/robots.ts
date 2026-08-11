import { absoluteUrl } from '@/constants/seo';
import type { MetadataRoute } from 'next';

// 로그인 뒤에서만 의미가 있는 화면(대시보드·마이·관리자 등)과 API는 크롤링에서 제외.
// 공개 색인 대상은 랜딩(/welcome)뿐이다.
const DISALLOW = [
  '/api/',
  '/admin',
  '/my/',
  '/dashboard',
  '/ai-analysis/',
  '/data-analysis/',
  '/market-data/',
  '/community/',
  '/login',
  '/welcome-v2',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOW,
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
