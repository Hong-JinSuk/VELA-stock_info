'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

// 캘린더 한 칸에 찍을 일정 항목 (지표 발표 / 시장 이벤트 공통 형태).
export type CalendarItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  categoryLabel: string;
  dotClass: string; // 점/칩 색 (solid bg)
  dDay: string;
  detail?: string;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// 달력 그리드 시작 = 그 달 1일이 속한 주의 일요일.
function gridStart(monthStart: Date): Date {
  const s = new Date(monthStart);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export default function ScheduleCalendar({ items }: { items: CalendarItem[] }) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const todayStr = ymd(today);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(today));

  // 날짜별 일정 묶음.
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const list = map.get(it.date);
      if (list) list.push(it);
      else map.set(it.date, [it]);
    }
    return map;
  }, [items]);

  // 6주(42칸) 고정 — 달 바뀌어도 높이가 흔들리지 않게.
  const cells = useMemo(() => {
    const start = gridStart(cursor);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  // 선택일: 기본은 이번 달에서 일정 있는 가장 이른 날(없으면 오늘).
  const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;
  const defaultSelected = useMemo(() => {
    // 오늘이 이번 달이고 일정이 있으면 오늘, 아니면 이번 달 일정 있는 가장 이른 날, 그것도 없으면 오늘.
    const withItems = cells.filter(
      (d) => d.getMonth() === cursor.getMonth() && byDate.has(ymd(d)),
    );
    if (byDate.has(todayStr) && withItems.some((d) => ymd(d) === todayStr)) {
      return todayStr;
    }
    const first = withItems[0];
    return first ? ymd(first) : todayStr;
    // monthKey로 달 전환 시 재계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, byDate]);

  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  // 달을 바꾸면 override를 무시하고 그 달 기본 선택으로 — override가 현재 그리드에 없으면 default 사용.
  const selected =
    selectedOverride && cells.some((d) => ymd(d) === selectedOverride)
      ? selectedOverride
      : defaultSelected;

  const selectedItems = byDate.get(selected) ?? [];

  const goMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelectedOverride(null);
  };
  const goToday = () => {
    setCursor(startOfMonth(today));
    setSelectedOverride(todayStr);
  };

  return (
    <div className="flex flex-col sm:min-h-0 sm:flex-1">
      {/* 월 네비게이션 */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tabular-nums">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            aria-label="다음 달"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={cn(
              'py-1',
              i === 0 && 'text-rose-400/80',
              i === 6 && 'text-sky-400/80',
            )}
          >
            {w}
          </span>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {cells.map((d) => {
          const ds = ymd(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = ds === todayStr;
          const isSelected = ds === selected;
          const dayItems = byDate.get(ds) ?? [];
          const shown = dayItems.slice(0, 2);
          const extra = dayItems.length - shown.length;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => setSelectedOverride(ds)}
              className={cn(
                'flex min-h-[4.5rem] flex-col items-stretch gap-0.5 bg-card/40 px-1 py-1 text-left transition-colors hover:bg-accent/40',
                !inMonth && 'opacity-35',
                isSelected && 'bg-accent ring-1 ring-inset ring-foreground/30',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center self-center rounded-full text-[11px] tabular-nums',
                  isToday && 'bg-primary font-semibold text-primary-foreground',
                  !isToday && d.getDay() === 0 && 'text-rose-400/90',
                  !isToday && d.getDay() === 6 && 'text-sky-400/90',
                )}
              >
                {d.getDate()}
              </span>
              {/* 누르기 전에도 일정 제목이 보이게 — 최대 2개 막대 + 나머지는 +N개 */}
              {dayItems.length > 0 && (
                <span className="flex min-w-0 flex-col gap-0.5">
                  {shown.map((it) => (
                    <span
                      key={it.id}
                      className="flex min-w-0 items-center gap-1"
                      title={it.title}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-[3px] shrink-0 rounded-full',
                          it.dotClass,
                        )}
                      />
                      <span className="truncate text-[9px] leading-tight text-foreground/80">
                        {it.title}
                      </span>
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="pl-1 text-[9px] leading-tight text-muted-foreground">
                      +{extra}개
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택일 상세 */}
      <div className="mt-3 sm:min-h-0 sm:flex-1 sm:overflow-y-auto no-scrollbar">
        {/* 날짜 헤더는 목록을 스크롤해도 상단에 고정 */}
        <p className="sticky top-0 z-10 mb-2 bg-background py-1 text-[11px] font-medium text-muted-foreground tabular-nums">
          {selected.slice(5).replace('-', '/')} 일정
          {selectedItems.length > 0 && ` · ${selectedItems.length}건`}
        </p>
        {selectedItems.length === 0 ? (
          <p className="rounded-lg border border-border bg-card/40 px-3 py-4 text-center text-xs text-muted-foreground">
            예정된 일정이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedItems.map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-border bg-card/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 shrink-0 rounded-full', it.dotClass)} />
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                    {it.categoryLabel}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
                    {it.dDay}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground break-keep">
                  {it.title}
                </p>
                {it.detail && (
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/60 break-keep">
                    {it.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
