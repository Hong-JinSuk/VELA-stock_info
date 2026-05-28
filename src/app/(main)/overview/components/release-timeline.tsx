'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getIndicatorScenario } from '@/constants/indicator-scenarios';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import type {
  IndicatorCategory,
  MacroIndicator,
} from '@/types/macro-indicator';
import { useMemo } from 'react';

type TimelineItem = MacroIndicator & {
  nextReleaseDate: string;
  daysUntil: number;
  releasedToday: boolean;
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

// releasedAt (ISO timestamp)이 오늘 KST와 같은 날짜인지.
function isReleasedToday(releasedAt: string | null): boolean {
  if (!releasedAt) return false;
  const released = new Date(releasedAt);
  if (Number.isNaN(released.getTime())) return false;
  const kstReleased = new Date(released.getTime() + 9 * 60 * 60 * 1000);
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return (
    kstReleased.toISOString().slice(0, 10) === kstNow.toISOString().slice(0, 10)
  );
}

function formatMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

function formatDDay(days: number): string {
  if (days === 0) return 'D-DAY';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
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
        releasedToday: isReleasedToday(i.releasedAt),
      }))
      .filter((i) => i.daysUntil >= 0 || i.releasedToday)
      .sort((a, b) => {
        // 오늘 발표된 카드는 최상단에 띄우기.
        if (a.releasedToday !== b.releasedToday) {
          return a.releasedToday ? -1 : 1;
        }
        return a.daysUntil - b.daysUntil;
      });
  }, [data]);

  return (
    <section className="flex flex-col w-full sm:min-h-0">
      {isLoading ? (
        <ol className="relative pl-6">
          <span
            aria-hidden
            className="absolute left-[7px] top-1 bottom-1 w-px bg-border"
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={`tl-${i}`} className="relative mb-3 last:mb-0">
              <span
                aria-hidden
                className="absolute -left-[18px] top-3 size-2 rounded-full bg-foreground/20 ring-2 ring-background"
              />
              <article className="rounded-lg border border-border bg-card/40 backdrop-blur-md px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-20 shrink-0" />
                </div>
                <Skeleton className="h-3 w-2/3 mb-2" />
                <div className="border-t border-border/40 pt-2 mt-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : isError ? (
        <div className="p-6 text-sm text-red-500">발표 캘린더 로드 실패</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          예정된 발표가 없습니다.
        </div>
      ) : (
        <ScrollArea className="sm:flex-1 sm:min-h-0">
          <ol className="relative pl-6">
            <span
              aria-hidden
              className="absolute left-[7px] top-1 bottom-1 w-px bg-border"
            />
            {items.map((item) => (
              <TimelineCard key={item.indicatorId} item={item} />
            ))}
          </ol>
        </ScrollArea>
      )}
    </section>
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
    releasedToday,
  } = item;
  const decimals = displayMeta.valueDecimals;
  const unit = displayMeta.unitSuffix;

  // 발표 당일에는 prev-prev → prev → 오늘 발표(value) 순으로 3개 표시.
  // value 변경 시 SQL이 shift시켰으므로:
  //   value          = 오늘 발표
  //   previousValue  = 그전 (어제까지 "현재"였던 값)
  //   prevPreviousValue = 전전 (어제까지 "이전"이었던 값)
  const showThreeValues = releasedToday && prevPreviousValue !== null;

  return (
    <li className="relative mb-3 last:mb-0">
      <span
        aria-hidden
        className={`absolute -left-[18px] top-3 size-2 rounded-full ring-2 ring-background ${
          releasedToday ? 'bg-emerald-400' : 'bg-foreground/40'
        }`}
      />
      <article
        className={`rounded-lg border bg-card/40 backdrop-blur-md px-4 py-3 transition-colors ${
          releasedToday
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
            {releasedToday && (
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                🆕 오늘 발표
              </span>
            )}
          </div>
          <div className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {formatDDay(daysUntil)} · {formatMonthDay(nextReleaseDate)}
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
              <span className="text-emerald-400/90">오늘 발표</span>{' '}
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
                  releasedToday
                    ? 'text-emerald-400/90'
                    : 'text-muted-foreground/70'
                }
              >
                {releasedToday ? '오늘 발표' : '현재'}
              </span>{' '}
              <span
                className={`tabular-nums font-medium ${
                  releasedToday ? 'text-emerald-300' : 'text-foreground'
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
              <p className="text-foreground/70">
                <span className="text-red-400/80 font-medium">↑ 상승하면</span>{' '}
                <span className="text-muted-foreground/40">—</span>{' '}
                {scenario.riseMeaning}
              </p>
              <p className="text-foreground/70">
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
