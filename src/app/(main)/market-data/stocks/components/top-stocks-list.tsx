'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { capture } from '@/lib/analytics';
import { useTopStocks } from '@/lib/services/stock/use-top-stocks';
import { cn } from '@/lib/utils';
import type { TopStock } from '@/types/stock';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import StockPreviewTeaser from './stock-preview-teaser';

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(v: number | null, withSign = true): string {
  if (v == null) return '';
  const sign = withSign && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

// 시가총액(백만 USD) → 읽기 쉬운 단위.
function fmtMarketCap(m: number | null): string | null {
  if (m == null || m <= 0) return null;
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(2)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
  return `$${Math.round(m)}M`;
}

// 매수/보유/매도 수 → 컨센서스 라벨 + 색.
function consensus(
  buy: number | null,
  hold: number | null,
  sell: number | null,
): { label: string; tone: string } | null {
  if (buy == null && hold == null && sell == null) return null;
  const b = buy ?? 0;
  const s = sell ?? 0;
  if (b === 0 && s === 0 && (hold ?? 0) === 0) return null;
  if (b > s * 1.5) return { label: '매수 우위', tone: 'text-emerald-500' };
  if (s > b * 1.5) return { label: '매도 우위', tone: 'text-rose-500' };
  return { label: '중립', tone: 'text-muted-foreground' };
}

// 의존성 없는 인라인 SVG 스파크라인. 종가 배열(오래된→최신)을 폴리라인으로.
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-8" />;
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className={up ? 'stroke-emerald-500' : 'stroke-rose-500'}
      />
    </svg>
  );
}

// 52주 고저 중 현재가 위치 게이지.
function Range52w({ item }: { item: TopStock }) {
  const { price, high52w, low52w } = item;
  if (price == null || high52w == null || low52w == null || high52w <= low52w) {
    return null;
  }
  const pos = Math.min(1, Math.max(0, (price - low52w) / (high52w - low52w)));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] tabular-nums text-muted-foreground/50">
        ${low52w.toFixed(0)}
      </span>
      <div className="relative h-1 flex-1 rounded-full bg-muted">
        <div
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 ring-2 ring-background"
          style={{ left: `${pos * 100}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground/50">
        ${high52w.toFixed(0)}
      </span>
    </div>
  );
}

function LogoBadge({ item }: { item: TopStock }) {
  if (item.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 외부 로고 URL, 소형 아이콘
      <img
        src={item.logo}
        alt=""
        className="size-7 shrink-0 rounded-md border border-border bg-white object-contain"
      />
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[11px] font-semibold text-muted-foreground">
      {item.symbol.slice(0, 1)}
    </span>
  );
}

function TopStockCard({ item }: { item: TopStock }) {
  const up = (item.changePercent ?? 0) >= 0;
  const cap = fmtMarketCap(item.marketCap);
  const cons = consensus(item.recBuy, item.recHold, item.recSell);
  return (
    <Link
      href={`/market-data/stocks/${encodeURIComponent(item.symbol)}`}
      onClick={() => capture('stock_selected', { symbol: item.symbol })}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-card/50 p-3 transition-colors hover:border-blue-500/50 hover:bg-accent/40"
    >
      {/* 상단: 로고 + 심볼/이름 + 가격/등락 */}
      <div className="flex items-center gap-2.5">
        <span className="w-4 shrink-0 text-center text-[11px] font-medium tabular-nums text-muted-foreground/50">
          {item.rank + 1}
        </span>
        <LogoBadge item={item} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {item.symbol}
          </p>
          <p className="truncate text-xs text-muted-foreground break-keep">
            {item.kr || item.name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums">
            {fmtPrice(item.price)}
          </p>
          {item.changePercent != null && (
            <p
              className={cn(
                'text-xs tabular-nums',
                up ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {fmtPct(item.changePercent)}
            </p>
          )}
        </div>
      </div>

      {/* 스파크라인 */}
      {(item.spark?.length ?? 0) >= 2 && <Sparkline data={item.spark} />}

      {/* 52주 위치 */}
      <Range52w item={item} />

      {/* 메타: 시총 · 1년 수익률 · 컨센서스 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {cap && (
          <span className="tabular-nums">
            시총 <span className="text-foreground/80">{cap}</span>
          </span>
        )}
        {item.priceReturn52w != null && (
          <span className="tabular-nums">
            1년{' '}
            <span
              className={
                item.priceReturn52w >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }
            >
              {fmtPct(item.priceReturn52w)}
            </span>
          </span>
        )}
        {cons && <span className={cn('font-medium', cons.tone)}>{cons.label}</span>}
      </div>
    </Link>
  );
}

/**
 * 종목찾기 빈 랜딩 — 인기 대형주 TOP20 리스트.
 * 배치 스냅샷(TopStockQuote)만 읽으므로 외부 API 호출 0회.
 * 데이터가 아직 없으면(첫 배치 전) 기존 샘플 티저로 폴백.
 */
export default function TopStocksList() {
  const { data, isLoading, isError } = useTopStocks();

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton className="mb-3 h-6 w-40 shrink-0" />
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[132px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 데이터 없음/에러 → 기존 샘플 티저로 조용히 폴백.
  if (isError || !data || data.length === 0) {
    return <StockPreviewTeaser />;
  }

  return (
    // 바깥 flex 컨테이너를 flex-1로 꽉 채워(바깥은 스크롤 안 함 → hero 고정),
    // 헤더 아래 그리드만 자체 스크롤. h-full(percentage) 대신 flex-1로 높이 체인 의존 제거.
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex shrink-0 items-center gap-2">
        <TrendingUp className="size-4 text-blue-500" />
        <h2 className="text-base font-semibold text-foreground">인기 종목</h2>
        <span className="text-xs text-muted-foreground/70 break-keep">
          많이 찾는 대형주 · 클릭하면 상세로
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <TopStockCard key={item.symbol} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
