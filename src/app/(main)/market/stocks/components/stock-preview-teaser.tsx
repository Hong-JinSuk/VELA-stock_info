'use client';

import { Button } from '@/components/ui/button';
import { useStockDetail } from '@/lib/services/stock/use-stock-detail';
import { FadeInView } from '@/motion/fade-in-view';
import { StaggerContainer } from '@/motion/stagger-containers';
import { Search } from 'lucide-react';
import Link from 'next/link';
import StockHeaderCard from './stock-header-card';
import StockMetricsCard from './stock-metrics-card';
import StockPriceChart from './stock-price-chart';
import StockQuoteCard from './stock-quote-card';

// 빈 랜딩에서 "검색하면 이렇게 보인다"를 보여줄 대표 티커.
const TEASER_SYMBOL = 'AAPL';

/**
 * 검색 전 빈 랜딩을 채우는 샘플 상세 티저.
 * 실제 상세 카드(헤더/차트/시세/지표)를 반투명으로 깔고,
 * 중앙 오버레이로 "검색하면 이렇게 보여요"를 안내한다.
 * 데이터를 못 불러오면(외부 API 차단 등) 기존 안내 문구로 조용히 폴백.
 */
export default function StockPreviewTeaser() {
  const detail = useStockDetail(TEASER_SYMBOL);

  if (detail.isLoading || detail.isError || !detail.data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
        티커를 검색해 종목 정보를 확인하세요.
      </div>
    );
  }

  const { profile, quote, metrics, priceTarget } = detail.data;

  return (
    <div className="relative">
      {/* 미리보기 본문 — 실제 상세 카드 재사용 + welcome 페이지와 동일한 stagger 등장.
          장식용이므로 상호작용/접근성 트리 차단. */}
      <div
        aria-hidden
        className="pointer-events-none select-none opacity-50"
      >
        <StaggerContainer className="flex flex-col gap-6" staggerStep={0.18}>
          <StockHeaderCard profile={profile} quote={quote} />
          <StockPriceChart ticker={TEASER_SYMBOL} priceTarget={priceTarget} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StockQuoteCard quote={quote} profile={profile} />
            </div>
            <div className="lg:col-span-2">
              <StockMetricsCard metrics={metrics} />
            </div>
          </div>
        </StaggerContainer>
      </div>

      {/* 카드들이 깔린 뒤 페이드 + 안내 오버레이가 떠오름 */}
      <FadeInView
        direction="none"
        delay={0.7}
        className="pointer-events-none absolute inset-0"
      >
        {/* 아래로 갈수록 배경에 묻히는 페이드 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        {/* 중앙 안내 오버레이 — 버튼만 클릭 가능 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="size-4" />
            검색하면 이렇게 보여요
          </p>
          <p className="text-xs text-muted-foreground break-keep">
            실시간 시세 · 차트 · 재무 지표 · 애널리스트 의견 · 내부자 거래 · 뉴스
          </p>
          <Button asChild size="sm" className="pointer-events-auto mt-1">
            <Link href={`/market/stocks/${TEASER_SYMBOL}`}>
              {TEASER_SYMBOL} 상세 보기
            </Link>
          </Button>
        </div>
      </FadeInView>
    </div>
  );
}
