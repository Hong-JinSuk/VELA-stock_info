'use client';

import SkeletonCard from '@/components/common/skeleton-card';
import { Switch } from '@/components/ui/switch';
import { getIndicatorScenario } from '@/constants/indicator-scenarios';
import {
  getUpcomingMarketEvents,
  type MarketEvent,
  type MarketEventCategory,
} from '@/constants/market-events';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import { cn } from '@/lib/utils';
import type {
  IndicatorCategory,
  MacroIndicator,
  SignalThresholds,
} from '@/types/macro-indicator';
import { CalendarDays, List } from 'lucide-react';
import { useMemo, useState } from 'react';
import ScheduleCalendar, { type CalendarItem } from './schedule-calendar';

type ChangeDirection = 'up' | 'down' | 'flat';
type ChangeMagnitude = 'minor' | 'notable' | 'clear';

// 이전값 대비 변화량을 catalog 임계값으로 분류.
function classifyChange(
  current: number,
  previous: number | null,
  thresholds: SignalThresholds | undefined,
): { direction: ChangeDirection; magnitude: ChangeMagnitude } {
  if (previous === null || !thresholds) {
    return { direction: 'flat', magnitude: 'minor' };
  }
  const diff = current - previous;
  if (diff === 0) return { direction: 'flat', magnitude: 'minor' };

  let metric: number;
  switch (thresholds.unit) {
    case 'mom_pct':
    case 'qoq_pct':
      metric = previous !== 0 ? (diff / previous) * 100 : 0;
      break;
    case 'abs_change':
    case 'abs_pp':
    case 'level_change':
      metric = diff;
      break;
  }

  const abs = Math.abs(metric);
  const direction: ChangeDirection = metric > 0 ? 'up' : 'down';
  let magnitude: ChangeMagnitude = 'minor';
  if (abs >= thresholds.clear) magnitude = 'clear';
  else if (abs >= thresholds.notable) magnitude = 'notable';

  return { direction, magnitude };
}

type TimelineItem = MacroIndicator & {
  nextReleaseDate: string;
  daysUntil: number;
  releasedRecently: boolean;
  daysSinceRelease: number | null;
};

const CATEGORY_STYLE: Record<string, { label: string; pill: string }> = {
  inflation: {
    label: 'INFLATION',
    pill: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  inflation_expectations: {
    label: 'INFL EXP',
    pill: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  employment: {
    label: 'JOBS',
    pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  growth: {
    label: 'GROWTH',
    pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  fed: {
    label: 'FED',
    pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  business_cycle: {
    label: 'CYCLE',
    pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  consumer: {
    label: 'CONSUMER',
    pill: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
  housing: {
    label: 'HOUSING',
    pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  rates: {
    label: 'RATES',
    pill: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  sentiment: {
    label: 'SENTIMENT',
    pill: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
  credit: {
    label: 'CREDIT',
    pill: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  currency: {
    label: 'FX',
    pill: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  commodities: {
    label: 'COMMOD',
    pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  policy_event: {
    label: 'POLICY',
    pill: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
};

// 시장 이벤트(만기·리밸런싱·FOMC) 카드의 카테고리 칩 스타일.
const EVENT_STYLE: Record<
  MarketEventCategory,
  { label: string; pill: string }
> = {
  fomc: {
    label: 'FOMC',
    pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  expiry: {
    label: 'EXPIRY',
    pill: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  },
  rebalance: {
    label: 'REBAL',
    pill: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
};

function getCategoryStyle(category: IndicatorCategory | null) {
  if (!category) {
    return {
      label: 'OTHER',
      pill: 'bg-muted text-muted-foreground border-border',
    };
  }
  return (
    CATEGORY_STYLE[category] ?? {
      label: category.toUpperCase(),
      pill: 'bg-muted text-muted-foreground border-border',
    }
  );
}

// 캘린더 뷰에서 날짜 칸에 찍는 점 색(카테고리별 solid bg). 지표·이벤트 카테고리 공용.
const DOT_CLASS: Record<string, string> = {
  inflation: 'bg-red-400',
  inflation_expectations: 'bg-red-400',
  employment: 'bg-blue-400',
  growth: 'bg-emerald-400',
  fed: 'bg-purple-400',
  business_cycle: 'bg-cyan-400',
  consumer: 'bg-pink-400',
  housing: 'bg-amber-400',
  rates: 'bg-yellow-400',
  sentiment: 'bg-green-400',
  credit: 'bg-orange-400',
  currency: 'bg-indigo-400',
  commodities: 'bg-amber-400',
  policy_event: 'bg-violet-400',
  fomc: 'bg-purple-400',
  expiry: 'bg-fuchsia-400',
  rebalance: 'bg-teal-400',
};
function dotClassFor(category: string | null): string {
  return (category && DOT_CLASS[category]) || 'bg-muted-foreground';
}

// "YYYY-MM-DD" → daysUntil (로컬 기준, 시간 정보 제거).
function getDaysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return Number.POSITIVE_INFINITY;
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// releasedAt 기준 KST로 며칠 전 발표인지 계산. 오늘=0, 어제=1, 그저께=2, ...
// 윈도우 밖(3일 이상 또는 미발표)이면 null.
function getDaysSinceRelease(releasedAt: string | null): number | null {
  if (!releasedAt) return null;
  const released = new Date(releasedAt);
  if (Number.isNaN(released.getTime())) return null;
  const kstReleased = new Date(released.getTime() + 9 * 60 * 60 * 1000);
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const releasedDay = new Date(kstReleased.toISOString().slice(0, 10));
  const nowDay = new Date(kstNow.toISOString().slice(0, 10));
  const diff = Math.round(
    (nowDay.getTime() - releasedDay.getTime()) / 86400000,
  );
  return diff >= 0 ? diff : null;
}

// 발표 후 2일 이내(D-day / D+1 / D+2)면 강조 카드로 취급.
function isReleasedRecently(releasedAt: string | null): boolean {
  const daysSince = getDaysSinceRelease(releasedAt);
  return daysSince !== null && daysSince <= 2;
}

function formatMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

// 카드 우상단 D-N 표시. 강조 카드(D-day~D+2)는 발표 후 일수 기준, 그 외는 다음 발표까지.
function formatDDay(
  daysUntil: number,
  daysSinceRelease: number | null,
): string {
  if (daysSinceRelease !== null && daysSinceRelease <= 2) {
    if (daysSinceRelease === 0) return 'D-DAY';
    return `D+${daysSinceRelease}`;
  }
  if (daysUntil === 0) return 'D-DAY';
  if (daysUntil > 0) return `D-${daysUntil}`;
  return `D+${Math.abs(daysUntil)}`;
}

function formatValue(
  value: number,
  decimals: number,
  unitSuffix: string,
): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${unitSuffix}`;
}

// 지표 발표 카드와 시장 이벤트(만기·FOMC) 카드를 한 타임라인에 합치기 위한 union.
type TimelineEntry =
  | { kind: 'indicator'; item: TimelineItem }
  | { kind: 'event'; event: MarketEvent; daysUntil: number };

function entryDaysUntil(entry: TimelineEntry): number {
  return entry.kind === 'indicator' ? entry.item.daysUntil : entry.daysUntil;
}

export default function ReleaseTimeline() {
  const { data, isLoading, isError } = useMacroIndicators();

  const items: TimelineItem[] = useMemo(() => {
    if (!data) return [];
    return data
      .filter((i): i is MacroIndicator & { nextReleaseDate: string } =>
        Boolean(i.nextReleaseDate),
      )
      .map((i) => ({
        ...i,
        daysUntil: getDaysUntil(i.nextReleaseDate),
        daysSinceRelease: getDaysSinceRelease(i.releasedAt),
        releasedRecently: isReleasedRecently(i.releasedAt),
      }))
      .filter((i) => i.daysUntil >= 0 || i.releasedRecently);
  }, [data]);

  const entries: TimelineEntry[] = useMemo(() => {
    const eventEntries: TimelineEntry[] = getUpcomingMarketEvents().map(
      (event) => ({
        kind: 'event',
        event,
        daysUntil: getDaysUntil(event.date),
      }),
    );
    const indicatorEntries: TimelineEntry[] = items.map((item) => ({
      kind: 'indicator',
      item,
    }));
    return [...indicatorEntries, ...eventEntries].sort((a, b) => {
      // 오늘 발표된 지표 카드는 최상단에 띄우기.
      const aRecent = a.kind === 'indicator' && a.item.releasedRecently;
      const bRecent = b.kind === 'indicator' && b.item.releasedRecently;
      if (aRecent !== bRecent) return aRecent ? -1 : 1;
      return entryDaysUntil(a) - entryDaysUntil(b);
    });
  }, [items]);

  // FOMC 카드에 현 정책금리(연방기금금리) 맥락을 붙이기 위해 fed_funds 지표를 찾아둔다.
  // fed_funds는 발표일정이 없어 타임라인 카드로는 안 뜨지만, 매크로 지표 데이터엔 있다.
  const policyRate = useMemo(
    () => data?.find((i) => i.indicatorId === 'fed_funds') ?? null,
    [data],
  );

  // 캘린더 뷰는 좁은 화면에 맞지 않아 모바일에서는 제공하지 않는다 (리스트 강제).
  const isMobile = useIsMobile();

  // 리스트(타임라인) ↔ 캘린더(월간) 전환.
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // 모바일에서는 캘린더를 막고 항상 리스트로 본다.
  const effectiveView = isMobile ? 'list' : view;

  // 캘린더 뷰용 — 같은 entries를 날짜·제목·색 형태로 평탄화.
  const calendarItems: CalendarItem[] = useMemo(
    () =>
      entries.map((entry) =>
        entry.kind === 'indicator'
          ? {
              id: entry.item.indicatorId,
              date: entry.item.nextReleaseDate,
              title: entry.item.displayMeta.cardName,
              categoryLabel: getCategoryStyle(entry.item.category).label,
              dotClass: dotClassFor(entry.item.category),
              dDay: formatDDay(
                entry.item.daysUntil,
                entry.item.daysSinceRelease,
              ),
            }
          : {
              id: entry.event.id,
              date: entry.event.date,
              title: entry.event.name,
              categoryLabel: EVENT_STYLE[entry.event.category].label,
              dotClass: dotClassFor(entry.event.category),
              dDay: formatDDay(entry.daysUntil, null),
              detail: entry.event.impact,
            },
      ),
    [entries],
  );

  return (
    <section className="flex flex-col w-full sm:min-h-0">
      {/* 보기 전환: 리스트 ⇄ 캘린더 (캘린더는 데스크톱 전용) */}
      {!isMobile && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <List
            className={cn(
              'size-4',
              view === 'list' ? 'text-foreground' : 'text-muted-foreground/40',
            )}
          />
          <Switch
            checked={view === 'calendar'}
            onCheckedChange={(c) => setView(c ? 'calendar' : 'list')}
            aria-label="리스트/캘린더 보기 전환"
          />
          <CalendarDays
            className={cn(
              'size-4',
              view === 'calendar'
                ? 'text-foreground'
                : 'text-muted-foreground/40',
            )}
          />
        </div>
      )}

      {isLoading ? (
        <SkeletonCard rows={6} cols={1} />
      ) : isError ? (
        <div className="p-6 text-sm text-red-500">발표 캘린더 로드 실패</div>
      ) : entries.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          예정된 발표가 없습니다.
        </div>
      ) : effectiveView === 'calendar' ? (
        <ScheduleCalendar items={calendarItems} />
      ) : (
        <section className="sm:flex-1 sm:min-h-0 no-scrollbar overflow-y-auto">
          <ol className="relative pl-6">
            <span
              aria-hidden
              className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-border"
            />
            {entries.map((entry) =>
              entry.kind === 'indicator' ? (
                <TimelineCard key={entry.item.indicatorId} item={entry.item} />
              ) : (
                <EventCard
                  key={entry.event.id}
                  event={entry.event}
                  daysUntil={entry.daysUntil}
                  policyRate={
                    entry.event.category === 'fomc' ? policyRate : null
                  }
                />
              ),
            )}
          </ol>
        </section>
      )}
    </section>
  );
}

// 시장 이벤트 카드 — 값/상승·하락 시나리오가 없는 일정 이벤트.
// 만기·리밸런싱의 "통상적 영향"(변동성·수급)을 표시한다.
// FOMC는 정책금리(fed_funds)를 받으면 지표 카드처럼 "이전 → 현재"로 현 기준금리를 함께 보여준다.
function EventCard({
  event,
  daysUntil,
  policyRate,
}: {
  event: MarketEvent;
  daysUntil: number;
  policyRate?: MacroIndicator | null;
}) {
  const { label, pill } = EVENT_STYLE[event.category];
  const rateMeta = policyRate?.displayMeta;
  return (
    <li className="relative mb-3 last:mb-0">
      <span
        aria-hidden
        className="absolute -left-[22px] top-3 size-2.5 rounded-full border-2 border-foreground/40 bg-background"
      />
      <article className="rounded-lg border border-border bg-card/40 backdrop-blur-md px-4 py-3 transition-colors hover:border-foreground/20">
        <header className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded border ${pill}`}
            >
              {label}
            </span>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {event.name}
            </h3>
            {event.badge && (
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400 border-violet-500/20 shrink-0">
                {event.badge}
              </span>
            )}
          </div>
          <div className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {formatDDay(daysUntil, null)} · {formatMonthDay(event.date)}
          </div>
        </header>
        {policyRate && rateMeta && (
          <div className="text-xs text-muted-foreground mb-2 break-keep">
            <span className="text-muted-foreground/70">
              {rateMeta.cardName} 이전
            </span>{' '}
            <span className="text-foreground/80 tabular-nums">
              {policyRate.previousValue !== null
                ? formatValue(
                    policyRate.previousValue,
                    rateMeta.valueDecimals,
                    rateMeta.unitSuffix,
                  )
                : '—'}
            </span>
            <span className="mx-1.5 text-muted-foreground/40">→</span>
            <span className="text-muted-foreground/70">현재</span>{' '}
            <span className="text-foreground tabular-nums font-medium">
              {formatValue(
                policyRate.value,
                rateMeta.valueDecimals,
                rateMeta.unitSuffix,
              )}
            </span>
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-foreground/70 break-keep">
          <span className="text-amber-400/80 font-medium">통상 영향</span>{' '}
          <span className="text-muted-foreground/40">—</span> {event.impact}
        </p>
      </article>
    </li>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  const { label, pill } = getCategoryStyle(item.category);
  const {
    displayMeta,
    previousValue,
    prevPreviousValue,
    value,
    nextReleaseDate,
    daysUntil,
    daysSinceRelease,
    releasedRecently,
  } = item;
  const decimals = displayMeta.valueDecimals;
  const unit = displayMeta.unitSuffix;
  // 강조 카드 라벨: 오늘 발표 → "오늘 발표", 어제/그저께 발표 → "최근 발표".
  const releasedLabel = daysSinceRelease === 0 ? '오늘 발표' : '최근 발표';

  // 발표 당일에는 prev-prev → prev → 오늘 발표(value) 순으로 3개 표시.
  // value 변경 시 SQL이 shift시켰으므로:
  //   value          = 오늘 발표
  //   previousValue  = 그전 (어제까지 "현재"였던 값)
  //   prevPreviousValue = 전전 (어제까지 "이전"이었던 값)
  const showThreeValues = releasedRecently && prevPreviousValue !== null;

  // 오늘 발표 카드에서 catalog 임계값으로 변화 강도 분류. 시나리오 줄 강조에 사용.
  const { direction, magnitude } = releasedRecently
    ? classifyChange(value, previousValue, displayMeta.signalThresholds)
    : {
        direction: 'flat' as ChangeDirection,
        magnitude: 'minor' as ChangeMagnitude,
      };
  const isClearRise = direction === 'up' && magnitude === 'clear';
  const isClearFall = direction === 'down' && magnitude === 'clear';

  return (
    <li className="relative mb-3 last:mb-0">
      <span
        aria-hidden
        className={`absolute -left-[22px] top-3 size-2.5 rounded-full border-2 bg-background ${
          releasedRecently ? 'border-emerald-400' : 'border-foreground/40'
        }`}
      />
      <article
        className={`rounded-lg border bg-card/40 backdrop-blur-md px-4 py-3 transition-colors ${
          releasedRecently
            ? 'border-emerald-500/30 hover:border-emerald-500/50'
            : 'border-border hover:border-foreground/20'
        }`}
      >
        <header className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded border ${pill}`}
            >
              {label}
            </span>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {displayMeta.cardName}
            </h3>
            {releasedRecently && (
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                🆕 {releasedLabel}
              </span>
            )}
          </div>
          <div className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {formatDDay(daysUntil, daysSinceRelease)} ·{' '}
            {formatMonthDay(nextReleaseDate)}
          </div>
        </header>

        <div className="text-xs text-muted-foreground mb-2">
          {showThreeValues ? (
            <>
              <span className="text-muted-foreground/70">전전</span>{' '}
              <span className="text-foreground/70 tabular-nums">
                {formatValue(prevPreviousValue!, decimals, unit)}
              </span>
              <span className="mx-1.5 text-muted-foreground/40">→</span>
              <span className="text-muted-foreground/70">이전</span>{' '}
              <span className="text-foreground/80 tabular-nums">
                {previousValue !== null
                  ? formatValue(previousValue, decimals, unit)
                  : '—'}
              </span>
              <span className="mx-1.5 text-muted-foreground/40">→</span>
              <span className="text-emerald-400/90">{releasedLabel}</span>{' '}
              <span className="text-emerald-300 tabular-nums font-semibold">
                {formatValue(value, decimals, unit)}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/70">이전</span>{' '}
              <span className="text-foreground/80 tabular-nums">
                {previousValue !== null
                  ? formatValue(previousValue, decimals, unit)
                  : '—'}
              </span>
              <span className="mx-1.5 text-muted-foreground/40">→</span>
              <span
                className={
                  releasedRecently
                    ? 'text-emerald-400/90'
                    : 'text-muted-foreground/70'
                }
              >
                {releasedRecently ? releasedLabel : '현재'}
              </span>{' '}
              <span
                className={`tabular-nums font-medium ${
                  releasedRecently ? 'text-emerald-300' : 'text-foreground'
                }`}
              >
                {formatValue(value, decimals, unit)}
              </span>
            </>
          )}
        </div>

        {(() => {
          const scenario = getIndicatorScenario(item.indicatorId);
          if (!scenario) return null;
          return (
            <div className="flex flex-col gap-1 text-[11px] leading-relaxed border-t border-border/40 pt-2 mt-1">
              <p
                className={
                  isClearRise ? 'text-foreground font-bold' : 'text-foreground/70'
                }
              >
                <span className="text-red-400/80 font-medium">↑ 상승하면</span>{' '}
                <span className="text-muted-foreground/40">—</span>{' '}
                {scenario.riseMeaning}
              </p>
              <p
                className={
                  isClearFall ? 'text-foreground font-bold' : 'text-foreground/70'
                }
              >
                <span className="text-blue-400/80 font-medium">↓ 하락하면</span>{' '}
                <span className="text-muted-foreground/40">—</span>{' '}
                {scenario.fallMeaning}
              </p>
            </div>
          );
        })()}
      </article>
    </li>
  );
}
