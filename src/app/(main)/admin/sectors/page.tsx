'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAddSectorIndicator,
  useAddSectorItem,
  useAdminSectors,
  useCreateSector,
  useDeleteSector,
  useRemoveSectorIndicator,
  useRemoveSectorItem,
  useUpdateSectorIndicator,
  useUpdateSectorItem,
} from '@/lib/services/admin/use-admin-sectors';
import { useStockSuggestions } from '@/lib/services/stock/use-stock-suggestions';
import { useTypeaheadNav } from '@/hooks/use-typeahead-nav';
import type { StockSuggestion } from '@/lib/services/stock/use-stock-suggestions';
import type {
  AdminSector,
  AdminSectorIndicator,
  AdminSectorItem,
} from '@/types/analysis';
import { cn } from '@/lib/utils';
import { INDICATOR_SERIES_OPTIONS } from '@/constants/indicator-series';
import { ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// 섹터에 종목/ETF를 검색해서 추가하는 입력 (기존 종목검색 자동완성 재사용).
function SectorItemAdder({ sectorId }: { sectorId: string }) {
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const { suggestions, isLoading } = useStockSuggestions(q, 12);
  const addItem = useAddSectorItem();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = suggestions.slice(0, 12);
  const isAddable = (r: StockSuggestion) => r.inDirectory !== false;

  const add = (symbol: string) => {
    addItem.mutate(
      { id: sectorId, symbol, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setQ('');
          setNote('');
          setOpen(false);
        },
      },
    );
  };

  const showSuggest = open && q.trim().length >= 2;

  // 종목찾기와 동일한 키보드 네비게이션(↑/↓/Enter/Esc). 추가 불가 항목 Enter는 무시.
  const { highlight, setHighlight, onKeyDown, reset } = useTypeaheadNav({
    items: results,
    isOpen: showSuggest,
    onClose: () => setOpen(false),
    listRef,
    onSelect: (r) => {
      if (isAddable(r) && !addItem.isPending) add(r.symbol);
    },
  });

  // 바깥 클릭으로 드롭다운 닫기.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="설명 (선택) — 검색해서 추가하면 함께 저장됩니다"
        className="h-9 text-sm"
        maxLength={300}
      />
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
          placeholder="종목/ETF 검색 후 추가 (예: RKLB)"
          className="h-9 text-sm"
          autoComplete="off"
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
              // 디렉터리(StockSymbol)에 없는 폴백 결과는 추가 불가 → 비활성 + 안내.
              const addable = isAddable(r);
              return (
                <button
                  key={r.symbol}
                  type="button"
                  data-typeahead-item
                  disabled={addItem.isPending || !addable}
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
    </div>
  );
}

// 추가된 항목 1건 — 심볼 + 설명(인라인 편집) + 제거.
function SectorItemRow({
  sectorId,
  item,
}: {
  sectorId: string;
  item: AdminSectorItem;
}) {
  const updateItem = useUpdateSectorItem();
  const removeItem = useRemoveSectorItem();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.note ?? '');

  const startEdit = () => {
    setDraft(item.note ?? '');
    setEditing(true);
  };
  const save = () => {
    const next = draft.trim() || null;
    if (next !== (item.note ?? null)) {
      updateItem.mutate({ id: sectorId, symbol: item.symbol, note: next });
    }
    setEditing(false);
  };

  return (
    <li className="flex items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <span className="font-mono text-xs font-medium">{item.symbol}</span>
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={save}
            autoFocus
            placeholder="설명 입력"
            maxLength={300}
            className="mt-1 h-8 text-xs"
            disabled={updateItem.isPending}
          />
        ) : item.note ? (
          <p className="mt-0.5 text-xs text-muted-foreground break-keep">
            {item.note}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground/50">설명 없음</p>
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={startEdit}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`${item.symbol} 설명 편집`}
        >
          <Pencil className="size-3.5" />
        </button>
      )}
      <ConfirmDialog
        title={<>&ldquo;{item.symbol}&rdquo; 항목을 제거할까요?</>}
        description="섹터에서 이 종목을 제거합니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="제거"
        onConfirm={() =>
          removeItem.mutate({ id: sectorId, symbol: item.symbol })
        }
        trigger={
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
            aria-label={`${item.symbol} 제거`}
          >
            <X className="size-3.5" />
          </button>
        }
      />
    </li>
  );
}

// 차트 연결(seriesKey) 선택 — 값 피드가 있는 지표(예: 토큰 처리량)를 그래프로 연결.
function SeriesSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="차트 연결 (선택)"
      className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-blue-500/50"
    >
      <option value="">차트 연결 없음</option>
      {INDICATOR_SERIES_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          📈 {o.label}
        </option>
      ))}
    </select>
  );
}

// 섹터 "중요 지표" 추가 폼 — 지표명 + 왜 중요한가 + 선택 링크 + 선택 차트 연결.
function SectorIndicatorAdder({ sectorId }: { sectorId: string }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [seriesKey, setSeriesKey] = useState('');
  const add = useAddSectorIndicator();

  const submit = () => {
    if (!name.trim() || !description.trim()) return;
    add.mutate(
      {
        id: sectorId,
        name: name.trim(),
        description: description.trim(),
        link: link.trim() || undefined,
        seriesKey: seriesKey || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setLink('');
          setSeriesKey('');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="지표명 (예: 토큰 처리량)"
          className="h-9 text-sm"
          maxLength={100}
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="왜 중요한가 (사용자 노출)"
          className="h-9 text-sm"
          maxLength={500}
        />
      </div>
      <Input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="링크 (선택) — /market-data/... 또는 https://..."
        className="h-9 text-sm"
        maxLength={300}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <SeriesSelect value={seriesKey} onChange={setSeriesKey} />
        <Button onClick={submit} disabled={add.isPending} className="h-9">
          지표 추가
        </Button>
      </div>
    </div>
  );
}

// 추가된 중요 지표 1건 — 인라인 편집(이름/설명/링크) + 제거.
function SectorIndicatorRow({
  sectorId,
  indicator,
}: {
  sectorId: string;
  indicator: AdminSectorIndicator;
}) {
  const update = useUpdateSectorIndicator();
  const remove = useRemoveSectorIndicator();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(indicator.name);
  const [description, setDescription] = useState(indicator.description);
  const [link, setLink] = useState(indicator.link ?? '');
  const [seriesKey, setSeriesKey] = useState(indicator.seriesKey ?? '');

  const startEdit = () => {
    setName(indicator.name);
    setDescription(indicator.description);
    setLink(indicator.link ?? '');
    setSeriesKey(indicator.seriesKey ?? '');
    setEditing(true);
  };
  const save = () => {
    if (!name.trim() || !description.trim()) {
      setEditing(false);
      return;
    }
    update.mutate({
      id: sectorId,
      indicatorId: indicator.id,
      name: name.trim(),
      description: description.trim(),
      link: link.trim() || null,
      seriesKey: seriesKey || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="지표명"
          className="h-8 text-xs"
          maxLength={100}
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="왜 중요한가"
          className="h-8 text-xs"
          maxLength={500}
        />
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="링크 (선택)"
          className="h-8 text-xs"
          maxLength={300}
        />
        <SeriesSelect value={seriesKey} onChange={setSeriesKey} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
            취소
          </Button>
          <Button size="sm" onClick={save} disabled={update.isPending}>
            저장
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {indicator.name}
          {indicator.seriesKey && (
            <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-normal text-blue-500">
              📈 차트
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground break-keep">
          {indicator.description}
        </p>
        {indicator.link && (
          <p className="mt-0.5 truncate font-mono text-[10px] text-blue-500/70">
            {indicator.link}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={startEdit}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={`${indicator.name} 편집`}
      >
        <Pencil className="size-3.5" />
      </button>
      <ConfirmDialog
        title={<>&ldquo;{indicator.name}&rdquo; 지표를 제거할까요?</>}
        description="섹터에서 이 지표를 제거합니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="제거"
        onConfirm={() =>
          remove.mutate({ id: sectorId, indicatorId: indicator.id })
        }
        trigger={
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
            aria-label={`${indicator.name} 제거`}
          >
            <X className="size-3.5" />
          </button>
        }
      />
    </li>
  );
}

function SectorCard({ sector }: { sector: AdminSector }) {
  const deleteSector = useDeleteSector();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border border-border bg-card/40"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-90',
            )}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {sector.name}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/70">
              /{sector.slug} · {sector.items.length}개
            </p>
          </div>
        </CollapsibleTrigger>
        <ConfirmDialog
          title={<>&ldquo;{sector.name}&rdquo; 섹터를 삭제할까요?</>}
          description="섹터와 담긴 종목 목록이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
          onConfirm={() => deleteSector.mutate(sector.id)}
          trigger={
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              aria-label="섹터 삭제"
            >
              <Trash2 className="size-4" />
            </button>
          }
        />
      </div>

      {/* 열린 상태에선 overflow-visible — 안의 종목검색 드롭다운이 카드 밖으로 떠야 함.
          닫힘 애니메이션은 base의 overflow-hidden이 그대로 적용돼 깔끔하게 유지됨. */}
      <CollapsibleContent className="data-[state=open]:overflow-visible">
        <div className="border-t border-border px-4 py-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            종목·ETF ({sector.items.length})
          </p>
          {sector.items.length > 0 && (
            <ul className="mb-3 flex flex-col gap-1.5">
              {sector.items.map((it) => (
                <SectorItemRow key={it.id} sectorId={sector.id} item={it} />
              ))}
            </ul>
          )}

          <SectorItemAdder sectorId={sector.id} />

          {/* 중요 지표 — 이 섹터에서 봐야 할 지표 큐레이션 */}
          <div className="mt-5 border-t border-dashed border-border pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              중요 지표 ({sector.indicators.length})
            </p>
            {sector.indicators.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1.5">
                {sector.indicators.map((ind) => (
                  <SectorIndicatorRow
                    key={ind.id}
                    sectorId={sector.id}
                    indicator={ind}
                  />
                ))}
              </ul>
            )}
            <SectorIndicatorAdder sectorId={sector.id} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminSectorsPage() {
  const { data, isLoading } = useAdminSectors();
  const createSector = useCreateSector();
  const [form, setForm] = useState({ slug: '', name: '', description: '' });

  const submit = () => {
    if (!form.slug.trim() || !form.name.trim()) return;
    createSector.mutate(
      {
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      },
      { onSuccess: () => setForm({ slug: '', name: '', description: '' }) },
    );
  };

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">섹터 분석 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          섹터(종목 바구니)를 만들고 종목·ETF를 추가합니다. 적정주가 등 숫자는
          새벽 배치가 자동으로 채웁니다.
        </p>
      </header>

      {/* 섹터 생성 */}
      <div className="rounded-2xl border border-border bg-card/40 p-5">
        <p className="mb-3 text-sm font-semibold">새 섹터</p>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr_auto]">
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="slug (예: space)"
            className="h-9 text-sm"
          />
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="이름 (예: 우주산업)"
            className="h-9 text-sm"
          />
          <Button
            onClick={submit}
            disabled={createSector.isPending}
            className="h-9"
          >
            생성
          </Button>
        </div>
        <Input
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="설명 (선택)"
          className="mt-2 h-9 text-sm"
        />
      </div>

      {/* 섹터 목록 — 리스트 + 아코디언 */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 섹터가 없습니다. 위에서 만들어 보세요.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data!.map((s) => (
            <SectorCard key={s.id} sector={s} />
          ))}
        </div>
      )}
    </main>
  );
}
