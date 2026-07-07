'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTypeaheadNav } from '@/hooks/use-typeahead-nav';
import {
  useAddValuationWatch,
  useAdminValuations,
  useRemoveValuationWatch,
  useSetGrowthOverrideMutation,
} from '@/lib/services/admin/use-admin-valuations';
import type { StockSuggestion } from '@/lib/services/stock/use-stock-suggestions';
import { useStockSuggestions } from '@/lib/services/stock/use-stock-suggestions';
import { cn } from '@/lib/utils';
import type { AdminValuationItem } from '@/types/valuation';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ALL_SECTORS = '__all__';
const OTHERS_KEY = '__others__';

const usd = (n: number | null) =>
  n == null
    ? '—'
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const pct = (n: number | null) => (n == null ? '—' : `${n.toFixed(1)}%`);

function ValuationCard({
  item,
  removable = false,
}: {
  item: AdminValuationItem;
  removable?: boolean;
}) {
  const setOverride = useSetGrowthOverrideMutation();
  const removeWatch = useRemoveValuationWatch();
  const [draft, setDraft] = useState(
    item.growthOverride != null ? String(item.growthOverride) : '',
  );
  const hasOverride = item.growthOverride != null;
  const isPending = item.status === 'PENDING';
  const pending = setOverride.isPending;

  const save = () => {
    const trimmed = draft.trim();
    const value = trimmed === '' ? null : Number(trimmed);
    if (value != null && !Number.isFinite(value)) return;
    setOverride.mutate({ symbol: item.symbol, growthOverride: value });
  };
  const clear = () => {
    setDraft('');
    setOverride.mutate({ symbol: item.symbol, growthOverride: null });
  };

  const up = item.upsidePct;
  const upColor =
    up == null
      ? 'text-muted-foreground'
      : up >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.name}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            {item.symbol} · {usd(item.price)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isPending && (
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              스냅샷 대기
            </span>
          )}
          {hasOverride && (
            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              조정중
            </span>
          )}
          {removable && (
            <ConfirmDialog
              title={<>&ldquo;{item.symbol}&rdquo; 종목을 제거할까요?</>}
              description="섹터 미지정 관리 목록에서 제거합니다. 이 작업은 되돌릴 수 없습니다."
              confirmLabel="제거"
              onConfirm={() => removeWatch.mutate(item.symbol)}
              trigger={
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label={`${item.symbol} 제거`}
                >
                  <X className="size-3.5" />
                </button>
              }
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground/70">사용 성장률</p>
          <p className="font-medium">{pct(item.growthPct)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">적정주가</p>
          <p className="font-medium">{usd(item.fairValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">상승여력</p>
          <p className={`font-medium ${upColor}`}>{pct(item.upsidePct)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            inputMode="decimal"
            placeholder="조정 성장률 %"
            className="h-9 pr-7 text-sm"
            disabled={pending}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
        <Button size="sm" className="h-9" onClick={save} disabled={pending}>
          적용
        </Button>
        {hasOverride && (
          <Button
            size="sm"
            variant="outline"
            className="h-9"
            onClick={clear}
            disabled={pending}
          >
            해제
          </Button>
        )}
      </div>
    </div>
  );
}

// "섹터 미지정" 관리 대상에 종목을 검색해 추가 (공용 종목검색 자동완성 + 키보드 네비 재사용).
function ValuationWatchAdder() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { suggestions, isLoading } = useStockSuggestions(q, 12);
  const addWatch = useAddValuationWatch();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = suggestions.slice(0, 12);
  const isAddable = (r: StockSuggestion) => r.inDirectory !== false;

  const add = (symbol: string) => {
    addWatch.mutate(symbol, {
      onSuccess: () => {
        setQ('');
        setOpen(false);
      },
    });
  };

  const showSuggest = open && q.trim().length >= 2;

  const { highlight, setHighlight, onKeyDown, reset } = useTypeaheadNav({
    items: results,
    isOpen: showSuggest,
    onClose: () => setOpen(false),
    listRef,
    onSelect: (r) => {
      if (isAddable(r) && !addWatch.isPending) add(r.symbol);
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
    <div ref={rootRef} className="relative sm:max-w-md">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          reset();
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="종목 검색 후 추가 (예: RKLB / 로켓랩)"
        className="h-9 text-sm"
        autoComplete="off"
        disabled={addWatch.isPending}
      />
      {showSuggest && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              검색 중...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              결과 없음
            </div>
          ) : (
            results.map((r, i) => {
              const addable = isAddable(r);
              return (
                <button
                  key={r.symbol}
                  type="button"
                  data-typeahead-item
                  disabled={addWatch.isPending || !addable}
                  onClick={() => addable && add(r.symbol)}
                  onMouseEnter={() => setHighlight(i)}
                  title={
                    addable
                      ? undefined
                      : '디렉터리에 없는 종목입니다(상장폐지/미수록). 추가할 수 없습니다.'
                  }
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
                    i === highlight ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <span className="font-mono font-medium">{r.symbol}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.kr || r.description}
                  </span>
                  {!addable && (
                    <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      추가 불가
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminValuationPage() {
  const { data, isLoading } = useAdminValuations();
  const [query, setQuery] = useState('');
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sectorKey, setSectorKey] = useState<string>(ALL_SECTORS);

  const allGroups = data ?? [];
  const sectorKeyOf = (g: { sectorId: string | null }) =>
    g.sectorId ?? OTHERS_KEY;
  const selectedGroup =
    sectorKey === ALL_SECTORS
      ? null
      : allGroups.find((g) => sectorKeyOf(g) === sectorKey);
  const sectorLabel =
    sectorKey === ALL_SECTORS
      ? '전체 섹터'
      : (selectedGroup?.sectorName ?? '전체 섹터');

  // 섹터 콤보박스로 1차 필터 → 텍스트 검색(심볼/이름 부분일치)로 2차 필터. 매칭 없는 섹터는 숨김.
  // 검색어는 디바운스해 매 타이핑마다 전체 목록을 다시 필터링하지 않는다.
  const debouncedQuery = useDebouncedValue(query, 200);
  const q = debouncedQuery.trim().toLowerCase();
  const matchQ = (it: AdminValuationItem) =>
    !q ||
    it.symbol.toLowerCase().includes(q) ||
    it.name.toLowerCase().includes(q);

  // "섹터 미지정"(null 그룹)은 관리자 추가 UI가 딸려 항상 렌더하므로 일반 섹터 그룹과 분리한다.
  const sectorGroups = allGroups
    .filter((group) => group.sectorId !== null)
    .filter((group) =>
      sectorKey === ALL_SECTORS ? true : sectorKeyOf(group) === sectorKey,
    )
    .map((group) => ({ ...group, items: group.items.filter(matchQ) }))
    .filter((group) => group.items.length > 0);

  const showOthers =
    sectorKey === ALL_SECTORS || sectorKey === OTHERS_KEY;
  const othersItems = (
    allGroups.find((g) => g.sectorId === null)?.items ?? []
  ).filter(matchQ);

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">적정주가 조정</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          종목별 <b>조정 성장률</b>을 입력하면 자동 성장률 대신 그 값으로 적정주가를
          다시 계산합니다(시트의 &lsquo;평균성장률 조정&rsquo;). 비우고 해제하면 자동
          성장률로 돌아갑니다. 저장 시 해당 종목이 즉시 재스냅샷됩니다. (ETF 제외)
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Popover open={sectorOpen} onOpenChange={setSectorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={sectorOpen}
              className="h-9 w-full justify-between font-normal sm:w-56"
            >
              <span className="truncate">{sectorLabel}</span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 sm:w-56">
            <Command>
              <CommandInput placeholder="섹터 검색..." className="h-9" />
              <CommandList>
                <CommandEmpty>섹터를 찾을 수 없습니다.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="전체 섹터"
                    onSelect={() => {
                      setSectorKey(ALL_SECTORS);
                      setSectorOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        sectorKey === ALL_SECTORS
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    전체 섹터
                  </CommandItem>
                  {allGroups.map((group) => {
                    const key = sectorKeyOf(group);
                    return (
                      <CommandItem
                        key={key}
                        value={group.sectorName}
                        onSelect={() => {
                          setSectorKey(key);
                          setSectorOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4',
                            sectorKey === key ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate">{group.sectorName}</span>
                        <span className="ml-auto pl-2 text-xs text-muted-foreground/70">
                          {group.items.length}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목 검색 (티커 / 이름)"
          className="h-9 text-sm sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {sectorGroups.map((group) => (
            <section key={group.sectorId}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {group.sectorName}
                </h2>
                <span className="text-xs text-muted-foreground/70">
                  {group.items.length}개
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <ValuationCard
                    key={`${group.sectorId}-${item.symbol}`}
                    item={item}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* 섹터 미지정 — 관리자가 직접 등록한 종목만. 추가 UI를 항상 노출. */}
          {showOthers && (
            <section>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  기타 (섹터 미지정)
                </h2>
                <span className="text-xs text-muted-foreground/70">
                  {othersItems.length}개
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground/80 break-keep">
                섹터에 없는 종목을 직접 등록해 적정주가를 관리합니다. 유저
                즐겨찾기는 여기 자동으로 뜨지 않습니다.
              </p>
              <div className="mb-3">
                <ValuationWatchAdder />
              </div>
              {othersItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {othersItems.map((item) => (
                    <ValuationCard
                      key={`others-${item.symbol}`}
                      item={item}
                      removable
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {q
                    ? '검색 결과가 없습니다.'
                    : '아직 등록한 종목이 없습니다. 위에서 검색해 추가하세요.'}
                </div>
              )}
            </section>
          )}

          {sectorGroups.length === 0 && !showOthers && (
            <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
              {q ? '검색 결과가 없습니다.' : '표시할 종목이 없습니다.'}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
