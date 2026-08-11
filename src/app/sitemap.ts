import { absoluteUrl } from '@/constants/seo';
import type { MetadataRoute } from 'next';

// 공개(로그인 불필요) 페이지만 넣는다. 앱 화면은 전부 인증 뒤라 색인 대상이 아니다.
// 새 공개 페이지(요금제·가이드·블로그 등)를 만들면 여기에 추가할 것.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/welcome'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
