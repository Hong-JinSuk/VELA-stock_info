'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  children: React.ReactNode;
};

// 로그인이 필요해서 막힌 경우의 메시지(가드 메시지 + 401 status fallback).
// 이 메시지의 토스트에는 "로그인하러가기" 액션 버튼을 붙인다.
const AUTH_REQUIRED_MESSAGES = new Set([
  '로그인이 필요합니다.',
  '인증이 필요합니다.',
]);

// 전역 토스트 액션에서 로그인 페이지로 보낼 때 사용. provider가 effect에서 주입(라우터 의존).
let navigateToLogin: (() => void) | null = null;

function showQueryError(message: string) {
  if (AUTH_REQUIRED_MESSAGES.has(message) && navigateToLogin) {
    const go = navigateToLogin;
    toast.error(message, {
      action: { label: '로그인하러가기', onClick: () => go() },
    });
    return;
  }
  toast.error(message);
}

export default function QueryProvider({ children }: Props) {
  const router = useRouter();
  useEffect(() => {
    navigateToLogin = () => router.push('/login');
    return () => {
      navigateToLogin = null;
    };
  }, [router]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: ({ message }) => showQueryError(message),
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.ignoreGlobalError) return; // 타입 에러 없음 ✅
            showQueryError(error.message);
          },
        }),
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서 캐시 상태 확인 가능한 데브 툴 */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
