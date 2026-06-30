'use client';

// PostHog 초기화 + App Router 페이지뷰 수동 캡처 + 로그인 유저 식별.
// SessionProvider(AuthContext) 안쪽에 둬야 useSession을 쓸 수 있다.
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { Suspense, useEffect, useRef } from 'react';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// App Router는 SDK 자동 pageview가 안 잡혀, 라우트 변경 시 직접 $pageview를 보낸다.
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    ph.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

// 로그인하면 이메일로 식별(이벤트를 사람 단위로 묶음), 로그아웃하면 reset.
function IdentifyUser() {
  const { data: session, status } = useSession();
  const ph = usePostHog();
  const identified = useRef(false);

  useEffect(() => {
    if (!ph) return;
    const email = session?.user?.email;
    if (status === 'authenticated' && email) {
      ph.identify(email, {
        email,
        name: session.user?.name ?? undefined,
      });
      identified.current = true;
    } else if (status === 'unauthenticated' && identified.current) {
      ph.reset();
      identified.current = false;
    }
  }, [status, session, ph]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!KEY) return;
    posthog.init(KEY, {
      api_host: `${BASE}/ingest`, // 리버스 프록시(next.config rewrites)
      ui_host: 'https://us.posthog.com', // 툴바/링크가 가리킬 PostHog 앱 (US)
      capture_pageview: false, // 위 PageviewTracker가 수동 캡처
      capture_pageleave: true,
      autocapture: true, // 클릭·입력 등 자동 수집
      person_profiles: 'identified_only', // 익명은 person 미생성(쿼터 절약)
      // TEMP: 세션 레코딩(rrweb) 끔 — 같은-탭 이동 시 DOM 직렬화로 멈춤이 나는지 확인용.
      disable_session_recording: true,
    });
  }, []);

  // 키 미설정이면 PostHog 없이 그대로 통과(로컬/미설정 안전).
  if (!KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <IdentifyUser />
      {children}
    </PHProvider>
  );
}
