import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  // 권한이 없으면 이 레이아웃에서 막아줘야함.
  return <div></div>;
}
