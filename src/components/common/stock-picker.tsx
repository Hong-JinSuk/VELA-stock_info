'use client';

import { Input } from '@/components/ui/input';
import { useTypeaheadNav } from '@/hooks/use-typeahead-nav';
import {
  type StockSuggestion,
  useStockSuggestions,
} from '@/lib/services/stock/use-stock-suggestions';
import { useEffect, useRef, useState } from 'react';

export type PickedStock = { symbol: string; name?: string };

const RESULT_LIMIT = 12;

// 종목 검색 자동완성 공용 피커 — 검색해서 1개를 고르면 onPick으로 넘긴다(선택 후 입력 초기화).
// 공용 규칙 준수: 한글/영문 자동분기(useStockSuggestions) + 키보드 네비(useTypeaheadNav) +
// 스크롤 드롭다운. 디렉터리에 없는 폴백 결과는 선택 불가 처리.
// (섹터 관리 등 admin 인라인 검색과 동일 UX — 추후 그쪽도 이 컴포넌트로 통합 가능.)
export function StockPicker({
  onPick,
  placeholder = '종목/ETF 검색 (예: AAPL, 엔비디아)',
  disabled,
}: {
  onPick: (stock: PickedStock) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading } = useStockSuggestions(q, RESULT_LIMIT);
  const results = suggestions.slice(0, RESULT_LIMIT);
  const isAddable = (r: StockSuggestion) => r.inDirectory !== false;
  const showSuggest = open && q.trim().length >= 2;

  const pick = (r: StockSuggestion) => {
    if (!isAddable(r)) return;
    onPick({ symbol: r.symbol, name: r.kr || r.description || undefined });
    setQ('');
    setOpen(false);
  };

  const { highlight, setHighlight, onKeyDown, reset } = useTypeaheadNav({
    items: results,
    isOpen: showSuggest,
    onClose: () => setOpen(false),
    listRef,
    onSelect: pick,
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
        placeholder={placeholder}
        className="h-9 text-sm"
        autoComplete="off"
        disabled={disabled}
      />
      {showSuggest && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div ref={listRef} className="scrollbar-subtle max-h-60 overflow-y-auto">
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
                    disabled={!addable}
                    onClick={() => pick(r)}
                    onMouseEnter={() => setHighlight(i)}
                    title={
                      addable
                        ? undefined
                        : '디렉터리에 없는 종목입니다(상장폐지/미수록). 선택할 수 없습니다.'
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
                        선택 불가
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
