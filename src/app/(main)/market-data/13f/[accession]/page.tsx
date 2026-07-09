'use client';

import FavoriteButton from '@/components/common/favorite-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { sectorColor, sectorLabel } from '@/constants/sector-colors';
import { krNameOf } from '@/constants/stock-korean-names';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useThirteenFChanges,
  type ThirteenFChangeType,
} from '@/lib/services/market/use-thirteenf-changes';
import { useThirteenFComparison } from '@/lib/services/market/use-thirteenf-comparison';
import { useThirteenFSectors } from '@/lib/services/market/use-thirteenf-sectors';
import type {
  ThirteenFActivity,
  ThirteenFChangeRow,
  ThirteenFSectorQuarter,
} from '@/types/thirteenf';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export default function Page() {
  const { accession } = useParams<{ accession: string }>();
  const { data, isLoading, isError, error } = useThirteenFComparison(accession);
  const sectorsQuery = useThirteenFSectors(data?.cik);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        13F 비교 데이터를 불러오는 중...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-red-500">
        로드 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">데이터 없음</div>;
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 gap-6">
      <header className="flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h1 className="font-serif text-xl tracking-tight">{data.filerName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            현재 분기 {data.current.periodEnding} (접수 {data.current.fileDate}) ·
            {data.previous
              ? ` 비교 분기 ${data.previous.periodEnding} (접수 ${data.previous.fileDate})`
              : ' 이전 분기 13F 없음 — 모두 신규 매수로 표시됩니다.'}
          </p>
        </div>
        <FavoriteButton
          type="THIRTEENF_FILER"
          itemKey={data.cik}
          label={data.filerName}
          size={22}
        />
      </header>

      {data.holdingsWithheld ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 shrink-0">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            보유 명세 비공개 (비밀유지 신청)
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground break-keep">
            이 분기는 SEC 비밀유지 신청(confidential treatment)으로 종목별 보유
            명세가 비공개입니다. 매도한 것이 아니라 명세만 가려진 상태로, 보통 약
            1년 뒤 수정신고(13F-HR/A)로 공개됩니다.
          </p>
          {data.reportedValueUsd != null && (
            <p className="mt-3 text-sm tabular-nums">
              <span className="text-muted-foreground">표지 신고총액 </span>
              <span className="font-semibold text-foreground">
                {formatUsd(data.reportedValueUsd)}
              </span>
              {data.reportedEntryCount ? (
                <span className="text-muted-foreground">
                  {' '}
                  · {data.reportedEntryCount.toLocaleString()}개 종목
                </span>
              ) : null}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground/60 break-keep">
            ※ 13F는 현금·비(非)13F 자산은 보고하지 않습니다. 신고총액은 13F 대상
            증권(미국 상장주식·ETF·옵션 등)의 시장가치 합계입니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          <Section
            title="🟢 매수 상위"
            accession={accession}
            rows={data.buys}
            count={data.buysCount}
            mode="buy"
            emptyText="이번 분기에 새로 매수하거나 비중을 늘린 종목이 없습니다."
          />
          <Section
            title="🔴 매도 상위"
            accession={accession}
            rows={data.sells}
            count={data.sellsCount}
            mode="sell"
            emptyText="이번 분기에 매도/축소한 종목이 없습니다."
          />
          <Section
            title="🔵 보유 상위"
            accession={accession}
            rows={data.holds}
            count={data.holdsCount}
            mode="hold"
            emptyText="보유 종목이 없습니다."
          />
        </div>
      )}

      {data.activity && (
        <ActivityPanel
          activity={data.activity}
          prevPeriod={data.previous?.periodEnding ?? null}
        />
      )}

      <SectorAllocationChart
        quarters={sectorsQuery.data ?? []}
        isLoading={sectorsQuery.isLoading}
      />
    </main>
  );
}

function formatPct(v: number, decimals = 2): string {
  return `${v.toFixed(decimals)}%`;
}

// 13F Activity 패널. 현재 분기 활동 요약 (직전 분기 대비).
function ActivityPanel({
  activity,
  prevPeriod,
}: {
  activity: ThirteenFActivity;
  prevPeriod: string | null;
}) {
  const {
    marketValueUsd,
    priorMarketValueUsd,
    netFlowPct,
    newPurchases,
    addedTo,
    soldOut,
    reducedHoldings,
    top10Pct,
    turnoverPct,
    altTurnoverPct,
  } = activity;

  return (
    <section className="border border-border rounded-xl bg-card/40 backdrop-blur-md overflow-hidden shrink-0">
      <h2 className="font-serif text-base font-semibold text-foreground px-5 pt-5 pb-3">
        13F 활동 요약
      </h2>
      <dl className="divide-y divide-border/40">
        <ActivityRow label="운용 규모">
          <span className="font-semibold text-foreground">
            {formatUsd(marketValueUsd)}
          </span>
          {priorMarketValueUsd != null && (
            <span className="text-muted-foreground/70">
              {' '}
              · 직전 {formatUsd(priorMarketValueUsd)}
            </span>
          )}
        </ActivityRow>
        <ActivityRow label="순유입(유출) 비율">
          {netFlowPct == null ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            <span
              className={
                netFlowPct < 0
                  ? 'font-semibold text-red-500'
                  : 'font-semibold text-emerald-500'
              }
            >
              {netFlowPct >= 0 ? '+' : ''}
              {formatPct(netFlowPct, 2)}
            </span>
          )}
        </ActivityRow>
        <ActivityRow label="신규 매수">
          {newPurchases}종목
        </ActivityRow>
        <ActivityRow label="비중 확대">{addedTo}종목</ActivityRow>
        <ActivityRow label="전량 매도">{soldOut}종목</ActivityRow>
        <ActivityRow label="비중 축소">{reducedHoldings}종목</ActivityRow>
        <ActivityRow label="상위 10 종목 비중">
          <span className="font-semibold text-foreground">
            {formatPct(top10Pct)}
          </span>
        </ActivityRow>
        <ActivityRow label="회전율">{formatPct(turnoverPct)}</ActivityRow>
        <ActivityRow label="회전율(대안)">
          {formatPct(altTurnoverPct)}
        </ActivityRow>
      </dl>
      <p className="px-5 py-3 text-[11px] text-muted-foreground/60 break-keep border-t border-border/40">
        매수/매도 분류는 가격 변동이 아닌 실제 보유 주식수 변동 기준입니다.
        {prevPeriod
          ? ` 직전 분기(${prevPeriod}) 대비.`
          : ' 직전 분기 13F가 없어 모두 신규로 집계됩니다.'}
      </p>
    </section>
  );
}

function ActivityRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5">
      <dt className="text-sm text-muted-foreground break-keep">{label}</dt>
      <dd className="text-sm tabular-nums text-right shrink-0">{children}</dd>
    </div>
  );
}

// "2025-09-30" → "Q3 2025"
function quarterLabel(periodEnding: string): string {
  const [year, month] = periodEnding.split('-');
  const q = Math.floor((Number(month) - 1) / 3) + 1;
  return `Q${q} ${year}`;
}

// 차트/범례 섹터 순서: 가장 최근 분기 비중 desc, 'Other'는 항상 맨 끝.
// 분기마다 같은 순서로 쌓아야 색 띠가 세로로 정렬돼 비교가 쉽다.
function orderedSectors(quarters: ThirteenFSectorQuarter[]): string[] {
  const weightMap = new Map<string, number>();
  for (const q of quarters) {
    for (const s of q.sectors) {
      if (!weightMap.has(s.sector)) weightMap.set(s.sector, 0);
    }
  }
  const latest = quarters[quarters.length - 1];
  if (latest) {
    for (const s of latest.sectors) weightMap.set(s.sector, s.weightPercent);
  }
  return Array.from(weightMap.keys()).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return (weightMap.get(b) ?? 0) - (weightMap.get(a) ?? 0);
  });
}

// 한 분기 누적 막대 + 그 분기 전체 섹터 비율 리스트 툴팁(데스크톱 hover / 모바일 tap).
function QuarterBar({
  quarter,
  sectors,
  isMobile,
}: {
  quarter: ThirteenFSectorQuarter;
  sectors: string[];
  isMobile: boolean;
}) {
  const bySector = new Map(quarter.sectors.map((s) => [s.sector, s.weightPercent]));
  // 막대는 전 분기 공통 순서로 쌓아 색 띠가 세로 정렬되게.
  const bar = (
    <div className="flex h-44 w-full max-w-[72px] flex-col overflow-hidden rounded-md bg-muted cursor-default outline-none">
      {sectors.map((sector) => {
        const w = bySector.get(sector) ?? 0;
        if (w <= 0) return null;
        return (
          <div
            key={sector}
            className={sectorColor(sector)}
            style={{ height: `${w}%` }}
          />
        );
      })}
    </div>
  );

  // 툴팁 내용: 그 분기의 모든 섹터를 비중 내림차순으로 나열.
  const rows = [...quarter.sectors].sort(
    (a, b) => b.weightPercent - a.weightPercent,
  );
  const content = (
    <div className="w-full space-y-1">
      <p className="mb-1.5 font-semibold">{quarterLabel(quarter.periodEnding)}</p>
      {rows.map((s) => (
        <div key={s.sector} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${sectorColor(s.sector)}`} />
            {sectorLabel(s.sector)}
          </span>
          <span className="font-medium tabular-nums">
            {s.weightPercent.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{bar}</PopoverTrigger>
        <PopoverContent side="top" className="w-56 text-xs">
          {content}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{bar}</TooltipTrigger>
      <TooltipContent side="top" showArrow={false} className="w-56">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// 분기별 섹터 배분 누적 막대 차트 (CSS 기반, sectorColor 재사용).
function SectorAllocationChart({
  quarters,
  isLoading,
}: {
  quarters: ThirteenFSectorQuarter[];
  isLoading: boolean;
}) {
  const sectors = orderedSectors(quarters);
  const isMobile = useIsMobile();
  return (
    <section className="border border-border rounded-xl bg-card/40 backdrop-blur-md p-5 shrink-0">
      <h2 className="font-serif text-base font-semibold text-foreground">
        섹터 배분 추이
      </h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground/60 break-keep">
        최근 {quarters.length || 4}개 분기 · 미분류·소형 보유는 기타로 합산
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          섹터 데이터를 불러오는 중...
        </p>
      ) : quarters.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground break-keep">
          섹터 배분 데이터 준비 중입니다 (다음 배치 후 표시).
        </p>
      ) : (
        <>
          <TooltipProvider>
            <div className="mt-4 flex items-end gap-3 sm:gap-6">
              {quarters.map((q) => (
                <div
                  key={q.periodEnding}
                  className="flex flex-1 flex-col items-center gap-2 min-w-0"
                >
                  <QuarterBar quarter={q} sectors={sectors} isMobile={isMobile} />
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {quarterLabel(q.periodEnding)}
                  </span>
                </div>
              ))}
            </div>
          </TooltipProvider>


          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
            {sectors.map((sector) => (
              <span
                key={sector}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <span className={`size-2 rounded-full ${sectorColor(sector)}`} />
                {sectorLabel(sector)}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// 큰 숫자 표시. >= 1B → "1.23B$", >= 1M → "12.3M$", 그 외 콤마.
function formatUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function ChangeRow({
  row,
  mode,
}: {
  row: ThirteenFChangeRow;
  mode: 'buy' | 'sell' | 'hold';
}) {
  const isNew = row.previousValueUsd === 0 && row.currentValueUsd > 0;
  const isSoldOut = row.currentValueUsd === 0 && row.previousValueUsd > 0;

  let badge: string | null = null;
  let badgeColor = '';
  if (mode === 'buy' && isNew) {
    badge = '신규';
    badgeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  } else if (mode === 'sell' && isSoldOut) {
    badge = '전량매도';
    badgeColor = 'text-red-500 bg-red-500/10 border-red-500/20';
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {(row.ticker ? krNameOf(row.ticker) : undefined) ?? row.nameOfIssuer}
            {row.ticker && (
              <span className="ml-1.5 text-[11px] font-mono text-muted-foreground/80">
                ({row.ticker})
              </span>
            )}
          </p>
          {row.putCall && (
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${
                row.putCall === 'Call'
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              }`}
              title={row.putCall === 'Call' ? '콜 옵션 (상승 베팅)' : '풋 옵션 (하락 베팅)'}
            >
              {row.putCall === 'Call' ? 'CALL' : 'PUT'}
            </span>
          )}
          {badge && (
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          CUSIP {row.cusip} · 비중 {row.weightPercent.toFixed(2)}%
        </p>
      </div>
      <div className="text-right shrink-0 tabular-nums">
        {mode === 'hold' ? (
          <p className="text-sm font-semibold text-foreground">
            {formatUsd(row.currentValueUsd)}
          </p>
        ) : (
          <>
            <p
              className={`text-sm font-semibold ${
                row.deltaValueUsd >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {row.deltaValueUsd >= 0 ? '+' : ''}
              {formatUsd(row.deltaValueUsd)}
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              {formatUsd(row.previousValueUsd)} →{' '}
              {formatUsd(row.currentValueUsd)}
            </p>
          </>
        )}
      </div>
    </li>
  );
}

const PREVIEW_LIMIT = 5;

function Section({
  title,
  accession,
  rows,
  count,
  mode,
  emptyText,
}: {
  title: string;
  accession: string;
  rows: ThirteenFChangeRow[];
  count: number; // 전체 개수 (rows는 상위 N개로 cap되어 있어 별도로 받음)
  mode: 'buy' | 'sell' | 'hold';
  emptyText: string;
}) {
  const preview = rows.slice(0, PREVIEW_LIMIT);
  const hasMore = count > PREVIEW_LIMIT;
  return (
    <section className="border border-border rounded-xl p-5 bg-card/40 backdrop-blur-md">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-base font-semibold text-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground/70 tabular-nums">
          {count}건
        </span>
      </div>
      {preview.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <ul className="space-y-0">
            {preview.map((r) => (
              <ChangeRow
                key={`${r.cusip}-${r.putCall ?? 'SH'}`}
                row={r}
                mode={mode}
              />
            ))}
          </ul>
          {hasMore && (
            <ChangesDialog
              accession={accession}
              type={mode}
              title={title}
              count={count}
            />
          )}
        </>
      )}
    </section>
  );
}

const DIALOG_PAGE_SIZE = 20;

// 전체보기 모달 — 서버 페이지네이션으로 buys/sells/holds 전체를 페이지 단위로 조회.
function ChangesDialog({
  accession,
  type,
  title,
  count,
}: {
  accession: string;
  type: ThirteenFChangeType;
  title: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchKey = useDebouncedValue(search.trim(), 250);
  const { data, isFetching, isError } = useThirteenFChanges(
    accession,
    type,
    page,
    DIALOG_PAGE_SIZE,
    searchKey,
    open,
  );
  const total = data?.total ?? count;
  const totalPages = Math.max(1, Math.ceil(total / DIALOG_PAGE_SIZE));
  const items = data?.items ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPage(1);
          setSearch('');
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="mt-3 text-[11px] font-medium text-primary hover:underline">
          전체 {count}건 보기 →
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="font-serif text-base">
            {title} · 전체 {count.toLocaleString()}건
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-border/60 px-5 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="종목명·티커 검색"
            className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-ring"
          />
        </div>

        <div className="max-h-[60vh] min-h-[12rem] overflow-y-auto px-5">
          {isError ? (
            <p className="py-8 text-center text-sm text-red-500">
              목록을 불러오지 못했습니다.
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isFetching
                ? '불러오는 중...'
                : searchKey
                  ? '검색 결과가 없습니다.'
                  : '항목이 없습니다.'}
            </p>
          ) : (
            <ul className={`space-y-0 ${isFetching ? 'opacity-60' : ''}`}>
              {items.map((r) => (
                <ChangeRow
                  key={`${r.cusip}-${r.putCall ?? 'SH'}`}
                  row={r}
                  mode={type}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 hover:bg-secondary"
          >
            이전
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 hover:bg-secondary"
          >
            다음
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
