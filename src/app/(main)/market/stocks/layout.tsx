import type { ReactNode } from 'react';
import StocksShell from './components/stocks-shell';

// 헤더("Stock Screener" + 검색바)는 StocksShell이 상단 고정으로 렌더하고,
// 스크롤 시 가로로 압축한다. children = 빈 랜딩(page.tsx) 또는 상세([ticker]/page.tsx).
export default function StocksLayout({ children }: { children: ReactNode }) {
  return <StocksShell>{children}</StocksShell>;
}
