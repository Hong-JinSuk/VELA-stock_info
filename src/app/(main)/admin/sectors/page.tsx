'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAddSectorItem,
  useAdminSectors,
  useCreateSector,
  useDeleteSector,
  useRemoveSectorItem,
} from '@/lib/services/admin/use-admin-sectors';
import { useStockSuggestions } from '@/lib/services/stock/use-stock-suggestions';
import type { AdminSector } from '@/types/analysis';
import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

// 섹터에 종목/ETF를 검색해서 추가하는 입력 (기존 종목검색 자동완성 재사용).
function SectorItemAdder({ sectorId }: { sectorId: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { suggestions: results, isLoading } = useStockSuggestions(q, 12);
  const addItem = useAddSectorItem();

  const add = (symbol: string) => {
    addItem.mutate(
      { id: sectorId, symbol },
      {
        onSuccess: () => {
          setQ('');
          setOpen(false);
        },
      },
    );
  };

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="종목/ETF 검색 후 추가 (예: RKLB)"
        className="h-9 text-sm"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              검색 중...
            </div>
          ) : (results?.length ?? 0) === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              결과 없음
            </div>
          ) : (
            results!.slice(0, 12).map((r) => {
              // 디렉터리(StockSymbol)에 없는 폴백 결과는 추가 불가 → 비활성 + 안내.
              const addable = r.inDirectory !== false;
              return (
                <button
                  key={r.symbol}
                  type="button"
                  disabled={addItem.isPending || !addable}
                  onClick={() => addable && add(r.symbol)}
                  title={
                    addable
                      ? undefined
                      : '디렉터리에 없는 종목입니다(상장폐지/미수록). 추가할 수 없습니다.'
                  }
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
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

function SectorCard({ sector }: { sector: AdminSector }) {
  const removeItem = useRemoveSectorItem();
  const deleteSector = useDeleteSector();

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{sector.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            /{sector.slug} · {sector.items.length}개
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`"${sector.name}" 섹터를 삭제할까요?`)) {
              deleteSector.mutate(sector.id);
            }
          }}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
          aria-label="섹터 삭제"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {sector.items.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {sector.items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <span className="font-mono font-medium">{it.symbol}</span>
              <button
                type="button"
                onClick={() =>
                  removeItem.mutate({ id: sector.id, symbol: it.symbol })
                }
                className="text-muted-foreground hover:text-rose-500"
                aria-label={`${it.symbol} 제거`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SectorItemAdder sectorId={sector.id} />
    </div>
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

      {/* 섹터 목록 */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 섹터가 없습니다. 위에서 만들어 보세요.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data!.map((s) => (
            <SectorCard key={s.id} sector={s} />
          ))}
        </div>
      )}
    </main>
  );
}
