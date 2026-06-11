'use client';

import { useParams } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import StockSearchBar from './stock-search-bar';

// stocks 공통 셸: "Stock Screener" 헤더 + 검색바를 상단에 고정(스크롤 안 함).
// 종목을 검색(상세 페이지)하면 큰 hero 대신 압축 헤더만 표시. 랜딩(검색 전)에서만 hero.
// 랜딩에서도 스크롤하면 헤더를 가로(flex)로 압축 — 타이틀 축소 + 부제 숨김 + 검색창을 옆으로.
export default function StocksShell({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // ticker가 있으면(= 검색해서 상세 페이지 진입) 큰 hero를 띄우지 않는다.
  const params = useParams<{ ticker?: string }>();
  const hasTicker = !!params.ticker;
  const condensed = hasTicker || scrolled;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
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
            ? 'py-3 border-b border-border bg-transparent backdrop-blur-md'
            : 'pt-10 pb-6 sm:pt-16'
        }`}
      >
        {condensed ? (
          <div className="flex items-center gap-3">
            <h1 className="shrink-0 font-serif tracking-tight text-base sm:text-lg">
              Stock Screener
            </h1>
            <div className="flex-1 min-w-0">
              <StockSearchBar />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="flex flex-col items-center gap-3">
              <h1 className="font-serif tracking-tight text-3xl sm:text-5xl break-keep">
                Stock Screener{' '}
                <span className="text-foreground/90">미국 주식 스크리너</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground break-keep max-w-xl">
                실시간 미국 주식 정보와 재무 데이터를 간편하게 검색하고
                분석하세요.
              </p>
            </div>

            {/* 빛나는 디바이더 */}
            <div className="relative w-full max-w-2xl h-px mt-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
              <div className="absolute inset-x-0 -top-1.5 h-3 bg-gradient-to-r from-transparent via-foreground/15 to-transparent blur-md" />
            </div>

            <div className="w-full flex justify-center">
              <StockSearchBar />
            </div>
          </div>
        )}
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
