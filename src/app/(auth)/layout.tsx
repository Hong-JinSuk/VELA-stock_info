import type { Metadata } from 'next';
import React from 'react';

// 로그인/가입 화면은 검색결과에 노출될 이유가 없다(색인 제외, 링크는 따라가게 둠).
export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false, follow: true },
};

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <div>{children}</div>;
}
