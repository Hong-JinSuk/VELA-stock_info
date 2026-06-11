'use client';

import DataTable from '@/components/common/data-table/data-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type ThirteenFFiler,
  useThirteenFFilers,
} from '@/lib/services/market/use-thirteenf-filers';
import { useThirteenFList } from '@/lib/services/market/use-thirteenf-list';
import {
  type PaginationState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { thirteenFColumns } from './columns';

const PAGE_SIZE = 20;
const SUGGEST_DEBOUNCE_MS = 200;

export default function Page() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [q, setQ] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [showSuggest, setShowSuggest] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 입력 → debounce → 서버 사이드 검색.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(input), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const { data: filers, isFetching: filersFetching } =
    useThirteenFFilers(debouncedInput);
  const suggestions = filers ?? [];
  const suggestLoading =
    filersFetching && debouncedInput.trim().length >= 1 && !filers;

  // dropdown 바깥 클릭으로 닫기.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!formRef.current?.contains(e.target as Node)) setShowSuggest(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function runSearch(value: string) {
    setQ(value.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setShowSuggest(false);
    setHighlight(-1);
    inputRef.current?.blur();
  }

  function onSelectSuggestion(f: ThirteenFFiler) {
    setInput(f.name);
    runSearch(f.name);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      onSelectSuggestion(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
      setHighlight(-1);
    }
  }

  const { data, isLoading, isError, error } = useThirteenFList({
    searchKey: q,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  const table = useReactTable({
    data: data?.items ?? [],
    columns: thirteenFColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? totalPages : -1,
    state: { pagination },
    onPaginationChange: setPagination,
    meta: {
      onRowClick: (row) => router.push(`/market/13f/${row.original.accession}`),
    },
  });

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden p-6">
      <header className="mb-4">
        <h1 className="font-serif text-xl tracking-tight">13F Filings</h1>
        <p className="text-sm text-muted-foreground">
          {data
            ? `총 ${total.toLocaleString()}건 · ${data.page} / ${totalPages} 페이지`
            : '13F 데이터를 불러오는 중...'}
        </p>
      </header>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(input);
        }}
        className="relative mb-4"
      >
        <button
          type="submit"
          aria-label="검색"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
        >
          <Search className="size-4" />
        </button>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggest(true);
            setHighlight(-1);
          }}
          onFocus={() => setShowSuggest(true)}
          onKeyDown={onKeyDown}
          placeholder="매니저 이름으로 검색 (예: Berkshire, Bridgewater, NPS)"
          className="pl-8 pr-8 h-9"
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput('');
              setQ('');
              setPagination((p) => ({ ...p, pageIndex: 0 }));
              setShowSuggest(false);
            }}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="size-4" />
          </button>
        )}
        {showSuggest && (suggestLoading || suggestions.length > 0) && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {suggestLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <li
                    key={`s-${i}`}
                    className="px-3 py-2 flex items-center justify-between gap-5"
                  >
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-16 shrink-0" />
                  </li>
                ))
              : suggestions.map((f, i) => (
                  <li key={f.cik}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelectSuggestion(f)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 ${
                        i === highlight ? 'bg-accent' : 'hover:bg-accent/60'
                      }`}
                    >
                      <span className="truncate">
                        {f.name}
                        {f.krName && (
                          <span className="text-muted-foreground/70 ml-2">
                            · {f.krName}
                          </span>
                        )}
                        {f.krNickname && (
                          <span className="text-muted-foreground/60 ml-2">
                            · {f.krNickname}
                          </span>
                        )}
                      </span>
                      <code className="text-[10px] text-muted-foreground/70 shrink-0">
                        {f.cik}
                      </code>
                    </button>
                  </li>
                ))}
          </ul>
        )}
      </form>

      {isError ? (
        <div className="p-6 text-sm text-red-500">
          13F 로드 실패:{' '}
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      ) : (
        <DataTable
          table={table}
          rowKey="cik"
          isLoading={isLoading}
          rowHeight={88}
          scrollX
          showPagination={!!data}
          pageSizeOptions={[20, 50, 100]}
          emptyMessage={
            q
              ? `"${q}"에 해당하는 filing이 없습니다.`
              : '조회된 13F filing이 없습니다.'
          }
        />
      )}
    </main>
  );
}
