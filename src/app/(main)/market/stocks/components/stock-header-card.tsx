'use client';

import {
  type CandleRange,
  useStockCandle,
} from '@/lib/services/stock/use-stock-candle';
import { fmtNum, shortExchange } from '@/lib/stock/format';
import type { StockProfile, StockQuote } from '@/types/stock';
import { ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { RANGES } from './stock-price-chart';

// 로고가 없을 때(ETF·로고없는 주식) 대체할 티커 이니셜 모노그램.
// 심볼 해시로 색을 결정적으로 골라 같은 종목은 항상 같은 색.
const MONOGRAM_COLORS = [
  'bg-blue-500/15 text-blue-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-violet-500/15 text-violet-300',
  'bg-amber-500/15 text-amber-300',
  'bg-rose-500/15 text-rose-300',
  'bg-cyan-500/15 text-cyan-300',
];

function monogram(ticker: string): { text: string; cls: string } {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) {
    h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
  }
  return {
    text: ticker.replace(/[.\-]/g, '').slice(0, 4),
    cls: MONOGRAM_COLORS[h % MONOGRAM_COLORS.length],
  };
}

export default function StockHeaderCard({
  profile,
  quote,
  range,
}: {
  profile: StockProfile;
  quote: StockQuote;
  /** 지정하면 등락 표시를 일간 대신 해당 기간(차트 토글과 동기화) 수익률로 보여준다. */
  range?: CandleRange;
}) {
  // 훅 규칙상 항상 호출 — 차트와 queryKey가 같아 중복 fetch는 없음 (react-query dedup).
  const { data: candle } = useStockCandle(profile.ticker, range ?? '6mo');
  const rangeBase = range !== undefined ? candle?.[0]?.close : undefined;
  const useRange = rangeBase != null && rangeBase > 0;

  // range 지정 시: 기간 시작 종가 대비 현재가 등락. 미지정/로딩 중: 일간 등락 (기존 동작).
  const change = useRange ? quote.current - rangeBase : quote.change;
  const percent = useRange
    ? ((quote.current - rangeBase) / rangeBase) * 100
    : quote.percentChange;
  const rangeLabel = useRange
    ? RANGES.find((r) => r.value === range)?.label
    : null;

  const down = change < 0;
  const color = down ? 'text-rose-500' : 'text-emerald-500';
  const Arrow = down ? TrendingDown : TrendingUp;
  const exchangeShort = shortExchange(profile.exchange);
  const mono = monogram(profile.ticker);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 lg:p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {profile.logo ? (
          // 외부 로고 URL — next/image remotePatterns 설정 회피 위해 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo}
            alt={profile.ticker}
            className="w-14 h-14 rounded-2xl object-contain bg-white/5 border border-border p-1 shrink-0"
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-2xl border border-border shrink-0 flex items-center justify-center font-bold tracking-tight ${
              mono.text.length >= 4 ? 'text-xs' : 'text-sm'
            } ${mono.cls}`}
          >
            {mono.text}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">
              {profile.ticker}
            </h2>
            {exchangeShort && (
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground bg-secondary border border-border rounded-md px-2 py-0.5">
                {exchangeShort}
              </span>
            )}
          </div>
          {profile.weburl ? (
            <a
              href={profile.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {profile.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">{profile.name}</p>
          )}
          {profile.industry && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {profile.industry}
            </p>
          )}
        </div>
      </div>

      <div className="text-left sm:text-right shrink-0">
        <div className="flex items-baseline gap-1.5 sm:justify-end">
          <span className="text-sm text-muted-foreground">
            {profile.currency}
          </span>
          <span className="text-4xl font-bold tracking-tight tabular-nums">
            {fmtNum(quote.current)}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 sm:justify-end mt-1 font-semibold tabular-nums ${color}`}
        >
          <Arrow className="w-4 h-4" />
          {fmtNum(Math.abs(change))} ({fmtNum(Math.abs(percent))}%)
          {rangeLabel && (
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              · {rangeLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
