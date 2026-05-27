'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type ThirteenFFiler,
  useThirteenFFilers,
} from '@/lib/services/market/use-thirteenf-filers';
import { useThirteenFList } from '@/lib/services/market/use-thirteenf-list';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const PAGE_SIZE = 20;
const MIN_SUGGEST_CHARS = 1;
const MAX_SUGGESTIONS = 8;

function filterFilers(filers: ThirteenFFiler[], q: string): ThirteenFFiler[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const startsWith: ThirteenFFiler[] = [];
  const contains: ThirteenFFiler[] = [];
  for (const f of filers) {
    const lower = f.name.toLowerCase();
    if (lower.startsWith(needle)) startsWith.push(f);
    else if (lower.includes(needle)) contains.push(f);
    if (startsWith.length >= MAX_SUGGESTIONS) break;
  }
  return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
}

export default function Page() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filersEnabled, setFilersEnabled] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: filers } = useThirteenFFilers(filersEnabled);

  const suggestions = useMemo(() => {
    if (!filers || input.trim().length < MIN_SUGGEST_CHARS) return [];
    return filterFilers(filers, input);
  }, [filers, input]);

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
    setPage(1);
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

  const { data, isLoading, isError, error, isFetching } = useThirteenFList({
    q,
    page,
    size: PAGE_SIZE,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
          onFocus={() => {
            setFilersEnabled(true);
            setShowSuggest(true);
          }}
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
              setPage(1);
              setShowSuggest(false);
            }}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="size-4" />
          </button>
        )}
        {showSuggest && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {suggestions.map((f, i) => (
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
                  <span className="truncate">{f.name}</span>
                  <code className="text-[10px] text-muted-foreground/70 shrink-0">
                    {f.cik}
                  </code>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">불러오는 중...</div>
      ) : isError ? (
        <div className="p-6 text-sm text-red-500">
          13F 로드 실패:{' '}
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          {q
            ? `"${q}"에 해당하는 filing이 없습니다.`
            : '조회된 13F filing이 없습니다.'}
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <ul
            className={`space-y-2 ${isFetching ? 'opacity-60 transition-opacity overflow-hidden' : ''}`}
          >
            {data.items.map((it) => (
              <li
                key={it.accession}
                className="border border-border rounded-lg bg-card/40 backdrop-blur-md hover:border-foreground/20 transition-colors"
              >
                <Link
                  href={`/market/13f/${it.accession}`}
                  className="block px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {it.filerName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        마지막 접수 {it.fileDate}
                        {it.bizLocation && ` · ${it.bizLocation}`}
                      </p>
                    </div>
                    <code className="text-[10px] text-muted-foreground/70 shrink-0">
                      {it.accession}
                    </code>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      {data && data.items.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-md border border-border bg-card/40 hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-md border border-border bg-card/40 hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </main>
  );
}
