'use client';

import {
  TICKER_KR,
  krNameOf,
  searchKrTickers,
} from '@/constants/stock-korean-names';
import { useStockSearch } from '@/lib/services/stock/use-stock-search';
import type { StockSearchItem } from '@/types/stock';
import { Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SUGGEST_DEBOUNCE_MS = 400;
const SUGGEST_LIMIT = 8;

type Suggestion = StockSearchItem & { kr?: string };

const HANGUL_RE = /[가-힣]/;

// 한글 입력이면 정적 한국어명 맵으로 매칭(API 미호출), 아니면 서버(/stock/search) 결과를
// 그대로 사용한다. 서버가 이미 매치품질(exact > prefix > contains)·인기·타입으로 랭킹하므로
// 클라에서 재정렬하지 않는다 — 재정렬하면 exact 심볼 매치인 ADR(TSM 등)이 보통주에 밀려
// 맨 아래로 내려가는 문제가 있었다. 어느 쪽이든 한국어명(kr)을 붙여 표시한다.
function buildSuggestions(
  query: string,
  serverItems: StockSearchItem[],
): Suggestion[] {
  if (HANGUL_RE.test(query.trim())) {
    return searchKrTickers(query)
      .slice(0, SUGGEST_LIMIT)
      .map((ticker) => ({
        symbol: ticker,
        displaySymbol: ticker,
        description: '',
        type: 'Common Stock',
        kr: TICKER_KR[ticker],
      }));
  }
  return serverItems
    .slice(0, SUGGEST_LIMIT)
    .map((it) => ({ ...it, kr: krNameOf(it.symbol) }));
}

// stocks 레이아웃에 상주하는 검색바. 입력 티커로 /market/stocks/{TICKER} 이동.
// 입력 중에는 Finnhub /search 자동완성 드롭다운을 표시(debounce).
export default function StockSearchBar() {
  const router = useRouter();
  const params = useParams<{ ticker?: string }>();
  const [value, setValue] = useState(
    params.ticker ? decodeURIComponent(params.ticker) : '',
  );
  const [debounced, setDebounced] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 입력 → debounce → 서버 사이드 검색.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  // 한글 입력은 Finnhub를 부르지 않고 정적 맵으로만 매칭(레이트리밋 절약).
  const isHangul = HANGUL_RE.test(debounced.trim());
  const { data, isFetching } = useStockSearch(isHangul ? '' : debounced);
  const suggestions = buildSuggestions(debounced, data ?? []);
  const suggestLoading =
    !isHangul && isFetching && debounced.trim().length >= 1 && !data;

  // 바깥 클릭으로 드롭다운 닫기.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setShowSuggest(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function goTo(symbol: string) {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) return;
    setShowSuggest(false);
    setHighlight(-1);
    inputRef.current?.blur();
    router.push(`/market/stocks/${encodeURIComponent(ticker)}`);
  }

  function onSelect(item: StockSearchItem) {
    setValue(item.symbol);
    goTo(item.symbol);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (showSuggest && highlight >= 0 && suggestions[highlight]) {
      onSelect(suggestions[highlight]);
      return;
    }
    goTo(value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
      setHighlight(-1);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full rounded-2xl border border-border bg-card/60 px-4 py-2.5 focus-within:border-blue-500/70 transition-colors"
      >
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggest(true);
            setHighlight(-1);
          }}
          onFocus={() => setShowSuggest(true)}
          onKeyDown={onKeyDown}
          placeholder="e.g. AAPL, TSLA, MSFT..."
          className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-muted-foreground/60"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-foreground text-background text-sm font-medium px-4 py-1.5 hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {showSuggest && (suggestLoading || suggestions.length > 0) && (
        <ul className="absolute left-0 right-0 top-full mt-2 z-30 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {suggestLoading ? (
            <li className="px-4 py-3 text-sm text-muted-foreground/60">
              검색 중…
            </li>
          ) : (
            suggestions.map((item, i) => (
              <li key={`${item.symbol}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 ${
                    i === highlight ? 'bg-accent' : 'hover:bg-accent/60'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-sm">{item.symbol}</span>
                    {item.kr && (
                      <span className="text-foreground/80 text-sm ml-2 break-keep">
                        {item.kr}
                      </span>
                    )}
                    {item.description && (
                      <span className="text-muted-foreground/60 text-xs ml-2 break-keep">
                        {item.description}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 border border-border rounded px-1.5 py-0.5">
                    {item.type === 'Common Stock' ? '보통주' : item.type}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
