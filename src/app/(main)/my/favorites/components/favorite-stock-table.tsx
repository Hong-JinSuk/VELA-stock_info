'use client';

import FavoriteButton from '@/components/common/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockQuotes } from '@/lib/services/stock/use-stock-quotes';
import { useStocksReport } from '@/lib/services/stocks-report/use-stocks-report';
import { fmtUsd } from '@/lib/stock/format';
import { cn } from '@/lib/utils';
import type { FavoriteItem } from '@/types/favorite';
import type { StockQuoteItem } from '@/types/stock';
import type { StockReportItem } from '@/types/stocks-report';
import Link from 'next/link';

// 섹터 분석 상세와 동일한 컬럼형 그리드. 행 클릭 시 종목 상세 페이지로 이동(새 탭).
const STOCK_GRID =
  'grid grid-cols-[minmax(0,1fr)_6rem_5.5rem_4.75rem_4.75rem] items-center gap-2';

function fmtNum(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${m}.${d}`;
}
function Dash() {
  return <span className="text-muted-foreground/40">—</span>;
}

// 부호 있는 % 배지(상승여력·고점대비). 양수 emerald / 음수 rose.
function PctPill({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) return <Dash />;
  const up = value >= 0;
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
        up ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500',
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

// 즐겨찾기 종목 — 섹터 분석 상세와 동일한 컬럼형 표(현재가/적정주가/상승여력/고점대비).
// 행 클릭 시 종목 상세 페이지를 새 탭으로 연다(자세한 값은 상세에서 확인).
// 적정주가 관련 값은 cron 스냅샷(StockValuation)을 DB에서 한 번에 읽고, 현재가는 라이브.
export default function FavoriteStockTable({
  items,
}: {
  items: FavoriteItem[];
}) {
  const symbols = items.map((it) => it.itemKey);
  const { data: quotes, isLoading } = useStockQuotes(symbols);
  const { data: report } = useStocksReport();

  const quoteMap = new Map<string, StockQuoteItem>(
    (quotes ?? []).map((q) => [q.symbol, q]),
  );
  const reportMap = new Map<string, StockReportItem>(
    (report ?? []).map((r) => [r.symbol, r]),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="min-w-[640px]">
        {/* 헤더 */}
        <div
          className={cn(
            STOCK_GRID,
            'border-b border-border bg-secondary/40 px-4 py-2.5 pl-12 text-xs font-medium text-muted-foreground',
          )}
        >
          <span>종목</span>
          <span className="text-right">현재가</span>
          <span className="text-right">적정주가</span>
          <span className="text-center">상승여력</span>
          <span className="text-center break-keep">고점대비</span>
        </div>

        {items.map((it) => {
          const q = quoteMap.get(it.itemKey);
          const r = reportMap.get(it.itemKey);
          const name = q?.name ?? r?.name ?? it.label ?? it.itemKey;
          const hasQuote = !!q && q.current > 0;
          const down = (q?.change ?? 0) < 0;

          const price = q?.current ?? r?.price ?? null;
          const high52w = r?.high52w ?? null;
          const high52wPct =
            price != null && high52w != null && high52w > 0
              ? ((price - high52w) / high52w) * 100
              : null;
          const date = shortDate(r?.snapshotAt ?? null);

          return (
            <div key={it.id} className="border-b border-border last:border-0">
              <div className="flex items-stretch hover:bg-accent/30">
                <div className="flex items-center pl-4">
                  <FavoriteButton
                    type="STOCK"
                    itemKey={it.itemKey}
                    label={it.label ?? undefined}
                    size={16}
                  />
                </div>
                <Link
                  href={`/market-data/stocks/${it.itemKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(STOCK_GRID, 'flex-1 py-3 pl-2 pr-4 text-left')}
                >
                  {/* 종목 */}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {name}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {it.itemKey}
                      {date && <span className="ml-1.5">· {date} 기준</span>}
                    </span>
                  </div>

                  {/* 현재가 (라이브) + 등락% */}
                  <div className="flex flex-col items-end tabular-nums">
                    {isLoading && !q ? (
                      <Skeleton className="h-4 w-14" />
                    ) : hasQuote ? (
                      <>
                        <span className="text-sm font-semibold text-foreground">
                          {fmtNum(q.current)}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            down ? 'text-rose-500' : 'text-emerald-500',
                          )}
                        >
                          {down ? '' : '+'}
                          {q.percentChange.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        시세 없음
                      </span>
                    )}
                  </div>

                  {/* 적정주가 — ETF는 개념 없음(—), 산정 못하면 측정 불가 */}
                  <div className="text-right">
                    {r?.isEtf ? (
                      <Dash />
                    ) : r?.status === 'OK' && r.fairValue != null ? (
                      <span className="text-sm font-semibold tabular-nums">
                        {fmtUsd(r.fairValue)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        측정 불가
                      </span>
                    )}
                  </div>

                  {/* 상승여력 */}
                  <div className="flex justify-center">
                    {r?.status === 'OK' ? (
                      <PctPill value={r.upsidePct} />
                    ) : (
                      <Dash />
                    )}
                  </div>

                  {/* 고점 대비 */}
                  <div className="flex justify-center">
                    <PctPill value={high52wPct} />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
