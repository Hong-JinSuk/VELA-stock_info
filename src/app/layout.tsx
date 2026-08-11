import ModalProvider from '@/components/providers/modal-provider';
import PostHogProvider from '@/components/providers/posthog-provider';
import QueryProvider from '@/components/providers/query-provider';
import ToastProvider from '@/components/providers/toast-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthContext from '@/context/auth-context';
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/constants/seo';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Geist, Geist_Mono } from 'next/font/google';
import './blue.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 사이트 전역 기본값. 하위 라우트는 layout에서 title/description/robots를 덮어쓴다.
// (앱 대부분이 'use client' 페이지라 metadata는 각 그룹의 서버 layout에 둔다.)
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: 'realtone' }],
  creator: 'realtone',
  publisher: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  // canonical은 여기서 주지 않는다 — 루트에 두면 noindex 화면(로그인·앱)까지 상속받아
  // "noindex + canonical → 색인 대상 페이지"라는 상충 신호가 된다. 랜딩 layout에서만 지정.
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    url: '/welcome',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // 서치 콘솔 소유 확인 값은 env로만 주입(없으면 태그를 아예 렌더하지 않음).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION }
      : {},
  },
};

// themeColor/colorScheme는 Next 14부터 metadata가 아닌 viewport로 분리됐다.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1115' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // ThemeProvider 때문에 class에 theme mode 에러발생 방지
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthContext>
          <PostHogProvider>
            <QueryProvider>
              <TooltipProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                </ThemeProvider>
                <ModalProvider />
              </TooltipProvider>
            </QueryProvider>
          </PostHogProvider>
        </AuthContext>
        <ToastProvider />
      </body>
    </html>
  );
}
