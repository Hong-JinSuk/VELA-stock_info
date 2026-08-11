import {
  absoluteUrl,
  SITE_CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/constants/seo';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 랜딩(/welcome)은 유일한 공개 색인 대상. 대표 URL을 여기서만 확정한다.
// title/description/openGraph는 루트 layout 기본값과 같으므로 다시 선언하지 않는다.
// ⚠️ 여기서 openGraph를 재정의하면 루트의 opengraph-image(파일 컨벤션)로 붙은
//    og:image가 통째로 날아간다(빌드 결과로 확인). 필요하면 images까지 같이 줄 것.
export const metadata: Metadata = {
  alternates: { canonical: '/welcome' },
};

// 검색결과 리치 스니펫용 구조화 데이터. 사이트 정체성(WebSite)과 운영 주체(Organization)를 함께 노출.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': absoluteUrl('/#website'),
      url: absoluteUrl('/'),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'ko-KR',
      publisher: { '@id': absoluteUrl('/#organization') },
    },
    {
      '@type': 'Organization',
      '@id': absoluteUrl('/#organization'),
      name: SITE_NAME,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/icon.svg'),
      email: SITE_CONTACT_EMAIL,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: SITE_CONTACT_EMAIL,
          availableLanguage: ['ko'],
        },
      ],
    },
  ],
};

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD는 스크립트 태그로 직접 주입하는 것이 표준 방식.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
