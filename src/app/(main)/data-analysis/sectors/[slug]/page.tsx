'use client';

import EtfHoldingsCard from '@/app/(main)/market-data/stocks/components/etf-holdings-card';
import TokenThroughputChart from './components/token-throughput-chart';
import { Skeleton } from '@/components/ui/skeleton';
import Sparkline from '@/components/common/sparkline';
import { analysisSectorTheme } from '@/constants/analysis-sector-icons';
import {
  INDICATOR_SERIES,
  isIndicatorSeriesKey,
} from '@/constants/indicator-series';
import { useAnalysisSectorDetail } from '@/lib/services/analysis/use-analysis-sectors';
import { useEtfPerformance } from '@/lib/services/stock/use-etf-performance';
import { useStockLogos } from '@/lib/services/stock/use-stock-logos';
import { cn } from '@/lib/utils';
import type {
  AnalysisSectorEtfRow,
  AnalysisSectorStockRow,
  SectorIndicator,
} from '@/types/analysis';
import type { EtfPeriodKey, EtfPerformance } from '@/types/sector';
import { ChevronDown, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const STOCK_GRID =
  'grid grid-cols-[minmax(0,1fr)_5rem_5rem_4.5rem_4rem_1.5rem] items-center gap-2';
const ETF_GRID =
  'grid grid-cols-[minmax(0,1fr)_5rem_repeat(7,3.5rem)_5rem_1.5rem] items-center gap-2';

const PERIODS: Array<{ key: EtfPeriodKey; label: string }> = [
  { key: 'd1', label: '1일' },
  { key: 'w1', label: '1주' },
  { key: 'm1', label: '1달' },
  { key: 'm3', label: '3달' },
  { key: 'm6', label: '6달' },
  { key: 'ytd', label: 'YTD' },
  { key: 'y1', label: '1년' },
];

const GROWTH_SRC: Record<string, string> = {
  EPS_TTM: '최근 1년',
  EPS_3Y: '3년',
  EPS_5Y: '5년',
};

function usd(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
function ReturnCell({ value }: { value: number | null }) {
  if (value == null) return <Dash />;
  const up = value >= 0;
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
        up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500',
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export default function AnalysisSectorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useAnalysisSectorDetail(slug);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const items = data?.items ?? [];
  const stocks = items.filter(
    (it): it is AnalysisSectorStockRow => it.kind === 'STOCK',
  );
  const etfs = items.filter(
    (it): it is AnalysisSectorEtfRow => it.kind === 'ETF',
  );

  const { data: perf, isLoading: perfLoading } = useEtfPerformance(
    etfs.map((e) => e.symbol),
  );
  const perfBySymbol = new Map((perf ?? []).map((p) => [p.symbol, p]));

  // 회사 로고(캐시 기반, 비동기) — 없으면 모노그램 폴백.
  const { data: logos } = useStockLogos(items.map((it) => it.symbol));
  const logoBySym = new Map((logos ?? []).map((l) => [l.symbol, l.logo]));

  const isEmpty = !isLoading && items.length === 0;

  // 헤더 아이콘·테마색 (리스트 카드와 동일 리졸버). 로딩 중엔 이름이 없어 기본 아이콘.
  const { Icon: SectorIcon, badge: sectorBadge } = analysisSectorTheme(
    data?.name ?? '',
    slug,
  );

  const toggle = (symbol: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header className="-mt-4">
        <Link
          href="/data-analysis/sectors"
          className="-ml-2 mb-1 inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← 섹터 분석
        </Link>
        <div className="mt-1 flex items-center gap-2.5">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${sectorBadge}`}
          >
            <SectorIcon className="size-5" />
          </span>
          <h1 className="font-serif text-xl tracking-tight">
            {data?.name ?? '섹터'}
          </h1>
        </div>
        {data?.description && (
          <p className="mt-1 text-sm text-muted-foreground break-keep">
            {data.description}
          </p>
        )}
      </header>

      {data && data.indicators.length > 0 && (
        <IndicatorsSection indicators={data.indicators} />
      )}

      {isError ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '불러올 수 없습니다.'}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          등록된 종목이 없습니다.
        </div>
      ) : (
        <>
          {/* 개별 종목 — 적정주가 */}
          {stocks.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">개별 종목</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <div className="min-w-[600px]">
                  <div
                    className={cn(
                      STOCK_GRID,
                      'border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground',
                    )}
                  >
                    <span>종목</span>
                    <span className="text-right">현재가</span>
                    <span className="text-right">적정주가</span>
                    <span className="text-center">상승여력</span>
                    <span className="text-center leading-tight break-keep">
                      수익성 (ROA)
                    </span>
                    <span />
                  </div>
                  {stocks.map((item) => (
                    <StockRow
                      key={item.symbol}
                      item={item}
                      logo={logoBySym.get(item.symbol) ?? null}
                      isOpen={open.has(item.symbol)}
                      onToggle={() => toggle(item.symbol)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ETF — 기간 추이 + 펼치면 보유종목 */}
          {etfs.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">ETF</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <div className="min-w-[920px]">
                  <div
                    className={cn(
                      ETF_GRID,
                      'border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground',
                    )}
                  >
                    <span>ETF</span>
                    <span className="text-right">현재가</span>
                    {PERIODS.map((p) => (
                      <span key={p.key} className="text-center">
                        {p.label}
                      </span>
                    ))}
                    <span className="text-center">추이</span>
                    <span />
                  </div>
                  {etfs.map((item) => (
                    <EtfRow
                      key={item.symbol}
                      item={item}
                      logo={logoBySym.get(item.symbol) ?? null}
                      perf={perfBySymbol.get(item.symbol)}
                      perfLoading={perfLoading}
                      isOpen={open.has(item.symbol)}
                      onToggle={() => toggle(item.symbol)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="break-keep">
              행을 클릭하면 펼쳐집니다. 개별 종목은 성장성·수익성 지표를, ETF는
              기간 추이와 보유종목(상위 10)을 보여줍니다. 적정주가는 자체
              추정치(새벽 배치 스냅샷)이며 적자 종목은 추정 불가입니다. ETF 추이는
              Yahoo 일봉 기준입니다. 투자 판단의 참고용입니다.
            </p>
          </div>
        </>
      )}
    </main>
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

// 종목/ETF 행 앞 로고 배지 — 로고 URL 있으면 이미지, 없으면 티커 모노그램 폴백.
function LogoBadge({ symbol, logo }: { symbol: string; logo: string | null }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 외부 로고 URL, 소형 아이콘
      <img
        src={logo}
        alt=""
        className="size-8 shrink-0 rounded-md border border-border bg-white object-contain"
      />
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[11px] font-semibold text-muted-foreground">
      {symbol.slice(0, 2)}
    </span>
  );
}

function StockRow({
  item,
  logo,
  isOpen,
  onToggle,
}: {
  item: AnalysisSectorStockRow;
  logo: string | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const date = shortDate(item.snapshotAt);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(STOCK_GRID, 'w-full px-4 py-3 text-left hover:bg-accent/30')}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoBadge symbol={item.symbol} logo={logo} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {item.symbol}
              {date && <span className="ml-1.5">· {date} 기준</span>}
            </span>
            {item.note && (
              <span className="mt-0.5 truncate text-[11px] text-muted-foreground break-keep">
                {item.note}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {item.price != null && item.price > 0 ? (
            <span className="text-sm tabular-nums">{usd(item.price)}</span>
          ) : (
            <span className="text-xs text-muted-foreground/60">
              {item.status === 'PENDING' ? '집계 중' : '—'}
            </span>
          )}
        </div>
        <div className="text-right">
          {item.status === 'PENDING' ? (
            <span className="text-xs text-muted-foreground/60">집계 중</span>
          ) : item.status === 'NO_DATA' || item.fairValue == null ? (
            <span className="text-xs text-muted-foreground/50">추정 불가</span>
          ) : (
            <span className="text-sm font-semibold tabular-nums">
              {usd(item.fairValue)}
            </span>
          )}
        </div>
        <div className="flex justify-center">
          {item.status === 'OK' && item.upsidePct != null ? (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
                item.upsidePct >= 0
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-rose-500/15 text-rose-500',
              )}
            >
              {item.upsidePct >= 0 ? '+' : ''}
              {item.upsidePct.toFixed(1)}%
            </span>
          ) : (
            <Dash />
          )}
        </div>
        <div className="flex justify-center">
          {item.roaTtm != null ? (
            <div className="flex flex-col items-center leading-tight">
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  roaQuality(item.roaTtm).cls,
                )}
              >
                {item.roaTtm.toFixed(1)}%
              </span>
              <span className={cn('text-[10px]', roaQuality(item.roaTtm).cls)}>
                {roaQuality(item.roaTtm).label}
              </span>
            </div>
          ) : (
            <Dash />
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <ExpandPanel isOpen={isOpen}>
        <StockDetail item={item} />
        <Link
          href={`/market-data/stocks/${item.symbol}`}
          className="mt-3 inline-block text-xs text-blue-500 hover:underline"
        >
          종목 상세 보기 →
        </Link>
      </ExpandPanel>
    </div>
  );
}

function EtfRow({
  item,
  logo,
  perf,
  perfLoading,
  isOpen,
  onToggle,
}: {
  item: AnalysisSectorEtfRow;
  logo: string | null;
  perf?: EtfPerformance;
  perfLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(ETF_GRID, 'w-full px-4 py-3 text-left hover:bg-accent/30')}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoBadge symbol={item.symbol} logo={logo} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {item.symbol}
            </span>
            {item.note && (
              <span className="mt-0.5 truncate text-[11px] text-muted-foreground break-keep">
                {item.note}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {perf?.price != null ? (
            <span className="text-sm tabular-nums">{usd(perf.price)}</span>
          ) : (
            <span className="text-xs text-muted-foreground/60">
              {perfLoading ? '집계 중' : '—'}
            </span>
          )}
        </div>
        {PERIODS.map((p) => (
          <div key={p.key} className="flex justify-center">
            <ReturnCell value={perf?.returns[p.key] ?? null} />
          </div>
        ))}
        <div className="flex justify-center">
          <div className="h-7 w-16">
            <Sparkline data={perf?.trend ?? []} />
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <ExpandPanel isOpen={isOpen}>
        <EtfHoldingsCard ticker={item.symbol} />
        <Link
          href={`/market-data/stocks/${item.symbol}`}
          className="mt-3 inline-block text-xs text-blue-500 hover:underline"
        >
          ETF 상세 보기 →
        </Link>
      </ExpandPanel>
    </div>
  );
}

function StockDetail({ item }: { item: AnalysisSectorStockRow }) {
  if (item.status === 'PENDING') {
    return (
      <p className="text-xs text-muted-foreground">
        아직 적정주가 스냅샷 전입니다 (집계 중). 새벽 배치가 처리하면 표시됩니다.
      </p>
    );
  }
  const growthSrc = item.growthSource ? GROWTH_SRC[item.growthSource] : null;
  const roa = item.roaTtm;
  const q = roa != null ? roaQuality(roa) : null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      <Metric
        label="성장성 (EPS 성장률)"
        value={
          item.growthPct != null
            ? `${item.growthPct >= 0 ? '+' : ''}${item.growthPct.toFixed(1)}%`
            : '—'
        }
        sub={growthSrc ?? undefined}
      />
      <Metric
        label="수익성 (ROA)"
        value={roa != null ? `${roa.toFixed(1)}%` : '—'}
        sub={q?.label}
        valueCls={q?.cls}
      />
      <Metric label="적정주가" value={usd(item.fairValue)} />
      <Metric label="52주 최고" value={usd(item.high52w)} />
      {item.status === 'NO_DATA' && (
        <p className="col-span-2 text-[11px] text-muted-foreground/70 sm:col-span-4">
          적자 또는 데이터 부족으로 적정주가는 추정 불가입니다(성장성·수익성은 참고).
        </p>
      )}
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

// 이 섹터에서 봐야 할 중요 지표(ADMIN 큐레이션). 차트 연결(seriesKey)이 있으면 그래프, 없으면 텍스트 카드.
function IndicatorsSection({
  indicators,
}: {
  indicators: SectorIndicator[];
}) {
  const charted = indicators.filter((i) => isIndicatorSeriesKey(i.seriesKey));
  const plain = indicators.filter((i) => !isIndicatorSeriesKey(i.seriesKey));
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        이 섹터에서 중요한 지표
      </h2>

      {charted.map((ind) => (
        <ChartedIndicatorCard key={ind.id} indicator={ind} />
      ))}

      {plain.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plain.map((ind) => (
            <div
              key={ind.id}
              className="rounded-xl border border-border bg-card/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground break-keep">
                  {ind.name}
                </h3>
                {ind.link && <IndicatorLink href={ind.link} />}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-keep">
                {ind.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// 차트형 지표 카드 — 설명 + 그래프 + 캐비엇(프록시 안내).
function ChartedIndicatorCard({ indicator }: { indicator: SectorIndicator }) {
  const meta = isIndicatorSeriesKey(indicator.seriesKey)
    ? INDICATOR_SERIES[indicator.seriesKey]
    : null;
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground break-keep">
          {indicator.name}
        </h3>
        {indicator.link && <IndicatorLink href={indicator.link} />}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-keep">
        {indicator.description}
      </p>
      <div className="mt-3">
        {indicator.seriesKey === 'TOKEN_THROUGHPUT' && <TokenThroughputChart />}
      </div>
      {meta?.caption && (
        <p className="mt-2 text-[11px] text-muted-foreground/50 break-keep">
          {meta.caption}
        </p>
      )}
    </div>
  );
}

// 지표 링크 — 외부(http)면 새 탭, 내부 경로면 Link.
function IndicatorLink({ href }: { href: string }) {
  const cls = 'shrink-0 text-xs text-blue-500 hover:underline';
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        보기 →
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      보기 →
    </Link>
  );
}
