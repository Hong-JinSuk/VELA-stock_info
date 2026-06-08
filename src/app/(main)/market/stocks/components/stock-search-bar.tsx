'use client';

import { Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// stocks 레이아웃에 상주하는 검색바. 입력 티커로 /market/stocks/{TICKER} 이동.
export default function StockSearchBar() {
  const router = useRouter();
  const params = useParams<{ ticker?: string }>();
  const [value, setValue] = useState(
    params.ticker ? decodeURIComponent(params.ticker) : '',
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (!ticker) return;
    router.push(`/market/stocks/${encodeURIComponent(ticker)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full max-w-2xl rounded-2xl border border-border bg-card/60 px-4 py-2.5 focus-within:border-blue-500/70 transition-colors"
    >
      <Search className="w-5 h-5 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
  );
}
