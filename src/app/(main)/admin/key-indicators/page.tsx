'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTypeaheadNav } from '@/hooks/use-typeahead-nav';
import {
  useAddKeyIndicator,
  useAdminKeyIndicators,
  useRemoveKeyIndicator,
} from '@/lib/services/admin/use-admin-key-indicators';
import { useMacroIndicators } from '@/lib/services/stock/use-macro-indicators';
import type { MacroIndicator } from '@/types/macro-indicator';
import { Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// 지표 표시명 — displayMeta.cardName(한국어) 우선, 없으면 id.
function nameOf(ind: MacroIndicator): string {
  return ind.displayMeta?.cardName || ind.indicatorId;
}

// 중요 지표로 추가할 지표를 검색해서 고르는 입력 (이미 추가된 건 제외).
function KeyIndicatorAdder({
  pool,
}: {
  pool: MacroIndicator[]; // 아직 추가 안 된 지표들
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const addKey = useAddKeyIndicator();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const key = q.trim().toLowerCase();
    const base = key
      ? pool.filter(
          (i) =>
            nameOf(i).toLowerCase().includes(key) ||
            i.indicatorId.toLowerCase().includes(key),
        )
      : pool;
    return base.slice(0, 12);
  }, [pool, q]);

  const add = (indicatorId: string) => {
    addKey.mutate(
      { indicatorId },
      {
        onSuccess: () => {
          setQ('');
          setOpen(false);
        },
      },
    );
  };

  const showSuggest = open;

  // 종목찾기와 동일한 키보드 네비게이션(↑/↓/Enter/Esc).
  const { highlight, setHighlight, onKeyDown, reset } = useTypeaheadNav({
    items: results,
    isOpen: showSuggest,
    onClose: () => setOpen(false),
    listRef,
    onSelect: (r) => {
      if (!addKey.isPending) add(r.indicatorId);
    },
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          reset();
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="지표 검색 후 추가 (예: 국채금리, ust_10y)"
        className="h-9 text-sm"
        autoComplete="off"
      />
      {showSuggest && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {pool.length === 0 ? '추가할 지표가 없습니다.' : '결과 없음'}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.indicatorId}
                type="button"
                data-typeahead-item
                disabled={addKey.isPending}
                onClick={() => add(r.indicatorId)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  i === highlight ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate font-medium">{nameOf(r)}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                  {r.indicatorId}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminKeyIndicatorsPage() {
  const { data: keys, isLoading: keysLoading } = useAdminKeyIndicators();
  const { data: indicators, isLoading: indLoading } = useMacroIndicators();
  const removeKey = useRemoveKeyIndicator();

  const byId = useMemo(
    () => new Map((indicators ?? []).map((i) => [i.indicatorId, i])),
    [indicators],
  );

  const addedIds = useMemo(
    () => new Set((keys ?? []).map((k) => k.indicatorId)),
    [keys],
  );

  // 추가 후보 풀 = 전체 지표 중 아직 중요 지표가 아닌 것 (이름 가나다순).
  const pool = useMemo(
    () =>
      (indicators ?? [])
        .filter((i) => !addedIds.has(i.indicatorId))
        .sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ko')),
    [indicators, addedIds],
  );

  const isLoading = keysLoading || indLoading;

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">중요 지표 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          경제지표 페이지 맨 위 &ldquo;중요 지표&rdquo; 묶음에 노출할 지표를
          직접 추가·제거합니다. 아래 카테고리 섹션에는 모든 지표가 그대로
          남습니다.
        </p>
      </header>

      {/* 지표 추가 */}
      <div className="rounded-2xl border border-border bg-card/40 p-5">
        <p className="mb-3 text-sm font-semibold">중요 지표 추가</p>
        <KeyIndicatorAdder pool={pool} />
      </div>

      {/* 현재 중요 지표 목록 */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (keys?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 중요 지표가 없습니다. 위에서 추가해 보세요.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys!.map((k) => {
            const ind = byId.get(k.indicatorId);
            return (
              <li
                key={k.indicatorId}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
              >
                <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {ind ? nameOf(ind) : k.indicatorId}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground/70">
                    {k.indicatorId}
                    {!ind && ' · 현재 데이터 없음'}
                  </p>
                </div>
                <ConfirmDialog
                  title={
                    <>
                      &ldquo;{ind ? nameOf(ind) : k.indicatorId}&rdquo;를 중요
                      지표에서 제거할까요?
                    </>
                  }
                  description="경제지표 페이지 상단 묶음에서만 빠집니다. 카테고리 섹션에는 그대로 남습니다."
                  confirmLabel="제거"
                  onConfirm={() => removeKey.mutate(k.indicatorId)}
                  trigger={
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                      aria-label={`${k.indicatorId} 제거`}
                    >
                      <X className="size-4" />
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
