import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from '@/constants/seo';
import type { MetadataRoute } from 'next';

// 모바일 홈화면 추가·설치 배너용 웹 매니페스트(/manifest.webmanifest).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: 'ko',
    start_url: '/welcome',
    scope: '/',
    display: 'standalone',
    background_color: '#0F1115',
    theme_color: '#0F1115',
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  };
}
