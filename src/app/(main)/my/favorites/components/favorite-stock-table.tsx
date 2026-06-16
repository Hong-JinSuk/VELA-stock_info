'use client';

import FavoriteButton from '@/components/common/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockIntraday } from '@/lib/services/stock/use-stock-intraday';
import { useStockQuotes } from '@/lib/services/stock/use-stock-quotes';
import type { FavoriteItem } from '@/types/favorite';
import type { StockIntradayPoint, StockQuoteItem } from '@/types/stock';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

function fmtNum(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// 행 안에 들어가는 1일 미니 스파크라인 (축 없음). 상승=emerald, 하락=rose.
function Sparkline({ points }: { points: StockIntradayPoint[] }) {
  if (points.length < 2) {
    return <div className="size-full" />;
  }
  const first = points[0].close;
  const last = points[points.length - 1].close;
  const up = last >= first;
  const color = up ? '#10b981' : '#f43f5e';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id="favSpark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#favSpark)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 즐겨찾기한 종목 목록 — 이름 + 1일 미니 차트 + 현재가/등락. 행 클릭 시 상세로 이동
// (애널리스트·내부자 등 Finnhub 한도 데이터는 상세 페이지에서 확인).
export default function FavoriteStockTable({
  items,
}: {
  items: FavoriteItem[];
}) {
  const symbols = items.map((it) => it.itemKey);
  const { data: quotes, isLoading } = useStockQuotes(symbols);
  const { data: intraday } = useStockIntraday(symbols);

  const quoteMap = new Map<string, StockQuoteItem>(
    (quotes ?? []).map((q) => [q.symbol, q]),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <ul className="divide-y divide-border">
        {items.map((it) => {
          const q = quoteMap.get(it.itemKey);
          const name = q?.name ?? it.label ?? it.itemKey;
          const hasQuote = !!q && q.current > 0;
          const down = (q?.change ?? 0) < 0;
          const color = down ? 'text-rose-500' : 'text-emerald-500';
          const Arrow = down ? TrendingDown : TrendingUp;
          const points = intraday?.get(it.itemKey) ?? [];

          return (
            <li
              key={it.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <FavoriteButton
                type="STOCK"
                itemKey={it.itemKey}
                label={it.label ?? undefined}
                size={16}
              />
              <Link
                href={`/market/stocks/${it.itemKey}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {name}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground/70">
                    {it.itemKey}
                  </span>
                </div>

                {/* 1일 미니 차트 */}
                <div className="h-9 w-16 shrink-0 sm:w-24">
                  <Sparkline points={points} />
                </div>

                <div className="flex w-[88px] shrink-0 flex-col items-end sm:w-28">
                  {isLoading && !q ? (
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ) : hasQuote ? (
                    <div className="flex flex-col items-end tabular-nums">
                      <span className="text-sm font-semibold text-foreground">
                        <span className="mr-1 text-[11px] font-normal text-muted-foreground">
                          {q.currency}
                        </span>
                        {fmtNum(q.current)}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${color}`}
                      >
                        <Arrow className="size-3" />
                        {fmtNum(Math.abs(q.change))} (
                        {fmtNum(Math.abs(q.percentChange))}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">
                      시세 없음
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
