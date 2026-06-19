'use client';

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
import {
  useAdminValuations,
  useSetGrowthOverrideMutation,
} from '@/lib/services/admin/use-admin-valuations';
import { cn } from '@/lib/utils';
import type { AdminValuationItem } from '@/types/valuation';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

const ALL_SECTORS = '__all__';

const usd = (n: number | null) =>
  n == null
    ? '—'
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const pct = (n: number | null) => (n == null ? '—' : `${n.toFixed(1)}%`);

function ValuationCard({ item }: { item: AdminValuationItem }) {
  const setOverride = useSetGrowthOverrideMutation();
  const [draft, setDraft] = useState(
    item.growthOverride != null ? String(item.growthOverride) : '',
  );
  const hasOverride = item.growthOverride != null;
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
        {hasOverride && (
          <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
            조정중
          </span>
        )}
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

export default function AdminValuationPage() {
  const { data, isLoading } = useAdminValuations();
  const [query, setQuery] = useState('');
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sectorKey, setSectorKey] = useState<string>(ALL_SECTORS);

  const allGroups = data ?? [];
  const sectorKeyOf = (g: { sectorId: string | null }) =>
    g.sectorId ?? '__others__';
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
  const groups = allGroups
    .filter((group) =>
      sectorKey === ALL_SECTORS ? true : sectorKeyOf(group) === sectorKey,
    )
    .map((group) => ({
      ...group,
      items: q
        ? group.items.filter(
            (it) =>
              it.symbol.toLowerCase().includes(q) ||
              it.name.toLowerCase().includes(q),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

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
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          {q
            ? '검색 결과가 없습니다.'
            : '스냅샷된 종목이 없습니다. 먼저 적정주가 배치를 실행하세요.'}
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((group) => (
            <section key={group.sectorId ?? '__others__'}>
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
                    key={`${group.sectorId ?? 'x'}-${item.symbol}`}
                    item={item}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
