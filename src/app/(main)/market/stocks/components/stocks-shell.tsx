'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import StockSearchBar from './stock-search-bar';

// stocks 공통 셸: "Stock Screener" 헤더 + 검색바를 상단에 고정(스크롤 안 함).
// 스크롤하면 헤더를 가로(flex)로 압축 — 타이틀 축소 + 부제 숨김 + 검색창을 옆으로.
export default function StocksShell({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setCondensed(el.scrollTop > 8);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0">
      {/* 상단 고정 헤더 */}
      <div
        className={`shrink-0 px-6 transition-all ${
          condensed
            ? 'py-3 border-b border-border bg-background/80 backdrop-blur-md'
            : 'pt-6 pb-4'
        }`}
      >
        <div
          className={
            condensed ? 'flex items-center gap-3' : 'flex flex-col gap-4'
          }
        >
          <div className="shrink-0">
            <h1
              className={`font-serif tracking-tight transition-all ${
                condensed ? 'text-base sm:text-lg' : 'text-3xl'
              }`}
            >
              Stock Screener
            </h1>
            {!condensed && (
              <p className="text-sm text-muted-foreground mt-1.5">
                실시간 주식 정보와 재무 상태를 확인하세요. (Powered by Finnhub)
              </p>
            )}
          </div>
          <div className={condensed ? 'flex-1 min-w-0' : 'w-full'}>
            <StockSearchBar />
          </div>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-6 pt-2"
      >
        {children}
      </div>
    </main>
  );
}
