'use client';

import FavoriteButton from '@/components/common/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockIntraday } from '@/lib/services/stock/use-stock-intraday';
import { useStockQuotes } from '@/lib/services/stock/use-stock-quotes';
import { useStocksReport } from '@/lib/services/stocks-report/use-stocks-report';
import { fmtUsd } from '@/lib/stock/format';
import { cn } from '@/lib/utils';
import type { FavoriteItem } from '@/types/favorite';
import type { StockIntradayPoint, StockQuoteItem } from '@/types/stock';
import type { StockReportItem } from '@/types/stocks-report';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

// 섹터 분석 상세와 동일한 컬럼형 그리드 + 행 펼침 구조.
const STOCK_GRID =
  'grid grid-cols-[minmax(0,1fr)_6rem_5.5rem_4.75rem_4.75rem_1.25rem] items-center gap-2';

const GROWTH_SRC: Record<string, string> = {
  EPS_TTM: '최근 1년',
  EPS_3Y: '3년',
  EPS_5Y: '5년',
  MANUAL: '조정',
};

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
function roaQuality(roa: number): { label: string; cls: string } {
  if (roa >= 15) return { label: '우수', cls: 'text-emerald-500' };
  if (roa >= 5) return { label: '양호', cls: 'text-sky-500' };
  if (roa >= 0) return { label: '보통', cls: 'text-muted-foreground' };
  return { label: '주의', cls: 'text-rose-500' };
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

// 행 안 1일 미니 스파크라인. 상승=emerald, 하락=rose.
function Sparkline({ points }: { points: StockIntradayPoint[] }) {
  if (points.length < 2) return <div className="size-full" />;
  const up = points[points.length - 1].close >= points[0].close;
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

function ExpandPanel({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out',
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="overflow-hidden">
        <div className="bg-secondary/20 px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  valueCls,
}: {
  label: string;
  value: string;
  sub?: string;
  valueCls?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', valueCls)}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
    </div>
  );
}

// 즐겨찾기 종목 — 섹터 분석 상세와 동일한 컬럼형 표(현재가/적정주가/상승여력/고점대비) + 행 펼침.
// 적정주가 관련 값은 cron 스냅샷(StockValuation)을 DB에서 한 번에 읽고, 현재가/차트는 라이브.
export default function FavoriteStockTable({
  items,
}: {
  items: FavoriteItem[];
}) {
  const symbols = items.map((it) => it.itemKey);
  const { data: quotes, isLoading } = useStockQuotes(symbols);
  const { data: intraday } = useStockIntraday(symbols);
  const { data: report } = useStocksReport();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const quoteMap = new Map<string, StockQuoteItem>(
    (quotes ?? []).map((q) => [q.symbol, q]),
  );
  const reportMap = new Map<string, StockReportItem>(
    (report ?? []).map((r) => [r.symbol, r]),
  );

  const toggle = (symbol: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

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
          <span />
        </div>

        {items.map((it) => {
          const q = quoteMap.get(it.itemKey);
          const r = reportMap.get(it.itemKey);
          const name = q?.name ?? r?.name ?? it.label ?? it.itemKey;
          const hasQuote = !!q && q.current > 0;
          const down = (q?.change ?? 0) < 0;
          const points = intraday?.get(it.itemKey) ?? [];

          const price = q?.current ?? r?.price ?? null;
          const high52w = r?.high52w ?? null;
          const high52wPct =
            price != null && high52w != null && high52w > 0
              ? ((price - high52w) / high52w) * 100
              : null;
          const isOpen = open.has(it.itemKey);
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
                <button
                  type="button"
                  onClick={() => toggle(it.itemKey)}
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

                  <ChevronDown
                    className={cn(
                      'size-4 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
              </div>

              <ExpandPanel isOpen={isOpen}>
                <FavoriteStockDetail report={r} points={points} />
                <Link
                  href={`/market-data/stocks/${it.itemKey}`}
                  className="mt-3 inline-block text-xs text-blue-500 hover:underline"
                >
                  종목 상세 보기 →
                </Link>
              </ExpandPanel>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FavoriteStockDetail({
  report,
  points,
}: {
  report: StockReportItem | undefined;
  points: StockIntradayPoint[];
}) {
  const spark = (
    <div className="h-12 w-full max-w-[180px]">
      <Sparkline points={points} />
    </div>
  );

  // ETF·펀드: 적정주가 산정 대상 아님.
  if (report?.isEtf) {
    return (
      <div className="flex flex-col gap-3">
        {spark}
        <p className="text-xs text-muted-foreground break-keep">
          ETF·펀드는 적정주가를 산정하지 않습니다. 보유종목·기간 추이는 종목
          상세에서 확인하세요.
        </p>
      </div>
    );
  }

  if (!report || report.status === 'PENDING') {
    return (
      <div className="flex flex-col gap-3">
        {spark}
        <p className="text-xs text-muted-foreground">
          아직 적정주가 스냅샷 전입니다 (집계 중). 새벽 배치가 처리하면
          표시됩니다.
        </p>
      </div>
    );
  }

  const growthSrc = report.growthSource
    ? GROWTH_SRC[report.growthSource]
    : undefined;
  const roa = report.roaTtm;
  const q = roa != null ? roaQuality(roa) : null;
  return (
    <div className="flex flex-col gap-3">
      {spark}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metric
          label="성장성 (EPS 성장률)"
          value={
            report.growthPct != null
              ? `${report.growthPct >= 0 ? '+' : ''}${report.growthPct.toFixed(1)}%`
              : '—'
          }
          sub={growthSrc}
        />
        <Metric
          label="수익성 (ROA)"
          value={roa != null ? `${roa.toFixed(1)}%` : '—'}
          sub={q?.label}
          valueCls={q?.cls}
        />
        <Metric
          label="적정주가"
          value={report.fairValue != null ? fmtUsd(report.fairValue) : '측정 불가'}
        />
        <Metric label="52주 최고" value={fmtUsd(report.high52w)} />
      </div>
      {report.status === 'NO_DATA' && (
        <p className="text-[11px] text-muted-foreground/70">
          적자 또는 데이터 부족으로 적정주가는 측정 불가입니다(성장성·수익성은 참고).
        </p>
      )}
    </div>
  );
}
