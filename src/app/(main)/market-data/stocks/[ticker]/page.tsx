'use client';

import type { CandleRange } from '@/lib/services/stock/use-stock-candle';
import { useStockDetail } from '@/lib/services/stock/use-stock-detail';
import { useStockEarnings } from '@/lib/services/stock/use-stock-earnings';
import { useStockInsider } from '@/lib/services/stock/use-stock-insider';
import { useStockNews } from '@/lib/services/stock/use-stock-news';
import { Info } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import AnalystRecommendationCard from '../components/analyst-recommendation-card';
import EarningsSurpriseCard from '../components/earnings-surprise-card';
import EtfHoldingsCard from '../components/etf-holdings-card';
import InsiderDetailCard from '../components/insider-detail-card';
import InsiderTrendCard from '../components/insider-trend-card';
import StockDetailSkeleton from '../components/stock-detail-skeleton';
import StockHeaderCard from '../components/stock-header-card';
import StockMetricsCard from '../components/stock-metrics-card';
import StockNewsList from '../components/stock-news-list';
import StockPriceChart from '../components/stock-price-chart';
import StockQuoteCard from '../components/stock-quote-card';
import TechnicalAnalysisCard from '../components/technical-analysis-card';

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = decodeURIComponent(ticker).toUpperCase();

  // 차트 기간 토글과 헤더 카드 등락%를 동기화하기 위해 페이지에서 관리.
  const [range, setRange] = useState<CandleRange>('6mo');
  const detail = useStockDetail(symbol);
  const insider = useStockInsider(symbol);
  const earnings = useStockEarnings(symbol);
  const news = useStockNews(symbol, detail.data?.profile.name);

  if (detail.isLoading) {
    return <StockDetailSkeleton />;
  }
  if (detail.isError) {
    return (
      <div className="py-16 text-center text-sm text-rose-500">
        로드 실패:{' '}
        {detail.error instanceof Error
          ? detail.error.message
          : '알 수 없는 오류'}
      </div>
    );
  }
  if (!detail.data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        종목을 찾을 수 없습니다.
      </div>
    );
  }

  const { profile, quote, metrics, recommendation, priceTarget } = detail.data;

  // ETF/펀드는 회사 지표·애널리스트·내부자 거래가 없음 → 시세·차트·뉴스만 표시.
  if (profile.isFund) {
    return (
      <div className="flex flex-col gap-6">
        <StockHeaderCard profile={profile} quote={quote} range={range} />
        <StockPriceChart
          ticker={symbol}
          priceTarget={priceTarget}
          range={range}
          onRangeChange={setRange}
        />
        <StockQuoteCard quote={quote} profile={profile} />
        <EtfHoldingsCard ticker={symbol} />
        <div className="rounded-2xl border border-border bg-card/40 p-4 flex items-start gap-2.5 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="break-keep">
            ETF·펀드는 회사 주요 지표, 애널리스트 의견, 내부자 거래 정보가
            제공되지 않습니다.
          </p>
        </div>
        <StockNewsList news={news.data ?? []} loading={news.isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StockHeaderCard profile={profile} quote={quote} range={range} />
      <StockPriceChart
        ticker={symbol}
        priceTarget={priceTarget}
        range={range}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StockQuoteCard quote={quote} profile={profile} />
        </div>
        <div className="lg:col-span-2">
          <StockMetricsCard metrics={metrics} />
        </div>
      </div>

      <EarningsSurpriseCard
        earnings={earnings.data}
        loading={earnings.isLoading}
      />

      <TechnicalAnalysisCard ticker={symbol} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalystRecommendationCard rec={recommendation} />
        <InsiderTrendCard
          monthly={insider.data?.monthly ?? []}
          loading={insider.isLoading}
        />
      </div>

      <InsiderDetailCard analysis={insider.data} loading={insider.isLoading} />
      <StockNewsList news={news.data ?? []} loading={news.isLoading} />
    </div>
  );
}
