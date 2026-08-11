import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 실험 중인 대체 랜딩. /welcome과 내용이 겹쳐 중복 색인을 만들므로 색인에서 제외한다.
export const metadata: Metadata = {
  title: 'VELA (preview)',
  robots: { index: false, follow: false },
};

export default function WelcomeV2Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
