'use client';

import { useThirteenFList } from '@/lib/services/market/use-thirteenf-list';
import Link from 'next/link';

export default function Page() {
  const { data, isLoading, isError, error } = useThirteenFList({
    page: 1,
    size: 20,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        13F 데이터를 불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-500">
        13F 로드 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        조회된 13F filing이 없습니다.
      </div>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar p-6">
      <header className="mb-4">
        <h1 className="font-serif text-xl tracking-tight">13F Filings</h1>
        <p className="text-sm text-muted-foreground">
          총 {data.total.toLocaleString()}건 · {data.page} 페이지 (페이지당 {data.pageSize}건)
        </p>
      </header>

      <ul className="space-y-2">
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
                    {it.formType} · 보유기준 {it.periodEnding} · 접수 {it.fileDate}
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
    </main>
  );
}
