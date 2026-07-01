'use client';

import { searchKrTickers } from '@/constants/stock-korean-names';
import { useTypeaheadNav } from '@/hooks/use-typeahead-nav';
import { capture } from '@/lib/analytics';
import { useStockSuggestions } from '@/lib/services/stock/use-stock-suggestions';
import type { StockSearchItem } from '@/types/stock';
import { Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SUGGEST_DEBOUNCE_MS = 400;
const SUGGEST_LIMIT = 8;

const HANGUL_RE = /[가-힣]/;

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

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 입력 → debounce → 서버 사이드 검색.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  // 한글이면 정적 맵, 영문/티커면 서버 — 공용 훅이 자동 분기하고 한국어명(kr)을 붙인다.
  const { suggestions, isLoading: suggestLoading } = useStockSuggestions(
    debounced,
    SUGGEST_LIMIT,
  );

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
    capture('stock_selected', { symbol: ticker });
    setShowSuggest(false);
    reset();
    inputRef.current?.blur();
    router.push(`/market-data/stocks/${encodeURIComponent(ticker)}`);
  }

  function onSelect(item: StockSearchItem) {
    setValue(item.symbol);
    goTo(item.symbol);
  }

  // 종목찾기/13F/섹터 관리 공용 키보드 네비게이션(↑/↓/Enter/Esc).
  const { highlight, setHighlight, onKeyDown, reset } = useTypeaheadNav({
    items: suggestions,
    isOpen: showSuggest,
    onClose: () => setShowSuggest(false),
    listRef,
    onSelect,
  });

  function handleSubmit(e: React.FormEvent) {
    // 강조 항목 Enter는 onKeyDown이 가로채므로, 여기로 오는 건 강조 없는 제출뿐.
    e.preventDefault();
    const raw = value.trim();
    // ⚠️ 한글은 티커가 아니므로 원문(예: "엔비디아")으로 이동하면 URL이 깨진다.
    // 정적 맵으로 즉시 해석해 최상단 매칭 종목으로 이동(디바운스/후보 상태와 무관하게 확실).
    if (HANGUL_RE.test(raw)) {
      const top = searchKrTickers(raw)[0];
      if (top) {
        goTo(top);
        return;
      }
    }
    // 영문: 후보 최상단이 있으면 우선(부분 입력 보정), 없으면 입력 원문(티커 직접 입력).
    goTo(suggestions[0]?.symbol ?? raw);
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
            reset();
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
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-2 z-30 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
        >
          {suggestLoading ? (
            <li className="px-4 py-3 text-sm text-muted-foreground/60">
              검색 중…
            </li>
          ) : (
            suggestions.map((item, i) => (
              <li key={`${item.symbol}-${i}`} data-typeahead-item>
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
