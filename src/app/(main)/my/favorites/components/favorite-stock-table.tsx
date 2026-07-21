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
import type { ReactNode } from 'react';

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

// 한 종목의 표시값 도출 — 데스크톱 표 행과 모바일 카드가 공용으로 쓴다.
function deriveRow(
  it: FavoriteItem,
  quoteMap: Map<string, StockQuoteItem>,
  reportMap: Map<string, StockReportItem>,
) {
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
  return { q, r, name, hasQuote, down, high52wPct, date };
}

// 즐겨찾기 종목 — 섹터 분석 상세와 동일한 컬럼형 표(현재가/적정주가/상승여력/고점대비).
// 데스크톱은 표, 모바일(<640px)은 카드. 행 클릭 시 종목 상세를 새 탭으로 연다.
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
    <>
      {/* 데스크톱: 표 (모바일은 아래 카드) */}
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
            const { q, r, name, hasQuote, down, high52wPct, date } = deriveRow(
              it,
              quoteMap,
              reportMap,
            );

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
                      ) : hasQuote && q ? (
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

      {/* 모바일: 카드형 */}
      <div className="flex flex-col gap-2 sm:hidden">
        {items.map((it) => (
          <FavoriteStockCard
            key={it.id}
            it={it}
            quoteMap={quoteMap}
            reportMap={reportMap}
            isLoading={isLoading}
          />
        ))}
      </div>
    </>
  );
}

// 모바일 종목 카드 — 별표(우상단) + 이름 + 현재가/적정주가/상승여력/고점대비.
// 카드 본문은 Link(새 탭 상세)이고, 별표는 그 위에 얹어 stopPropagation으로 분리.
function FavoriteStockCard({
  it,
  quoteMap,
  reportMap,
  isLoading,
}: {
  it: FavoriteItem;
  quoteMap: Map<string, StockQuoteItem>;
  reportMap: Map<string, StockReportItem>;
  isLoading: boolean;
}) {
  const { q, r, name, hasQuote, down, high52wPct, date } = deriveRow(
    it,
    quoteMap,
    reportMap,
  );
  return (
    <div className="relative rounded-xl border border-border">
      <div className="absolute right-3 top-3 z-10">
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
        className="block rounded-xl p-4 hover:bg-accent/30"
      >
        <div className="pr-8">
          <span className="block truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {it.itemKey}
            {date && <span className="ml-1.5">· {date} 기준</span>}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          <CardStat label="현재가">
            {isLoading && !q ? (
              <Skeleton className="h-4 w-14" />
            ) : hasQuote && q ? (
              <span className="tabular-nums">
                <span className="text-sm font-semibold text-foreground">
                  {fmtNum(q.current)}
                </span>
                <span
                  className={cn(
                    'ml-1 text-[11px] font-medium',
                    down ? 'text-rose-500' : 'text-emerald-500',
                  )}
                >
                  {down ? '' : '+'}
                  {q.percentChange.toFixed(1)}%
                </span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/60">시세 없음</span>
            )}
          </CardStat>
          <CardStat label="적정주가">
            {r?.isEtf ? (
              <Dash />
            ) : r?.status === 'OK' && r.fairValue != null ? (
              <span className="text-sm font-semibold tabular-nums">
                {fmtUsd(r.fairValue)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">측정 불가</span>
            )}
          </CardStat>
          <CardStat label="상승여력">
            {r?.status === 'OK' ? <PctPill value={r.upsidePct} /> : <Dash />}
          </CardStat>
          <CardStat label="고점대비">
            <PctPill value={high52wPct} />
          </CardStat>
        </dl>
      </Link>
    </div>
  );
}

// 모바일 카드의 라벨:값 한 칸.
function CardStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
