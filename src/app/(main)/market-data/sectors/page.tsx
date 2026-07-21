'use client';
// useReactTable 인스턴스(가변 객체)를 다루는 컴포넌트 — React Compiler memoization과
// 충돌하므로 컴파일러 제외. (CLAUDE.md "React Compiler 주의" 참고)
'use no memo';

import DataTable from '@/components/common/data-table/data-table';
import { useSectorPerformance } from '@/lib/services/market/use-sector-performance';
import type { SectorPerformance, SectorPeriodKey } from '@/types/sector';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { buildSectorColumns, PERIODS } from './columns';

const DEFAULT_PERIOD: SectorPeriodKey = 'd1';

// 정렬 옵션. default = API(SECTOR_ETFS 정의) 순서 고정 — 기간을 바꿔도 행이 안 움직인다.
type SortMode = 'default' | 'desc' | 'asc';

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'default', label: '기본 순서' },
  { value: 'desc', label: '수익률 높은 순' },
  { value: 'asc', label: '수익률 낮은 순' },
];

// 선택 기간 수익률 기준 정렬. null(데이터 없음)은 항상 맨 뒤.
function sortRows(
  items: SectorPerformance[],
  period: SectorPeriodKey,
  mode: SortMode,
): SectorPerformance[] {
  if (mode === 'default') return items;
  return [...items].sort((a, b) => {
    const av = a.returns[period];
    const bv = b.returns[period];
    if (av == null) return 1;
    if (bv == null) return -1;
    return mode === 'desc' ? bv - av : av - bv;
  });
}

export default function Page() {
  const router = useRouter();
  const [period, setPeriod] = useState<SectorPeriodKey>(DEFAULT_PERIOD);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const { data, isLoading, isError, error } = useSectorPerformance();

  const columns = useMemo(() => buildSectorColumns(period), [period]);
  const sectorRows = useMemo(
    () =>
      sortRows(
        (data ?? []).filter((x) => x.group === 'sector'),
        period,
        sortMode,
      ),
    [data, period, sortMode],
  );
  const industryRows = useMemo(
    () =>
      sortRows(
        (data ?? []).filter((x) => x.group === 'industry'),
        period,
        sortMode,
      ),
    [data, period, sortMode],
  );

  const meta = {
    onRowClick: (row: { original: SectorPerformance }) =>
      router.push(`/market-data/stocks/${row.original.ticker}`),
  };
  const sectorTable = useReactTable({
    data: sectorRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });
  const industryTable = useReactTable({
    data: industryRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  return (
    <main className="flex flex-1 min-h-0 flex-col overflow-y-auto p-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-xl tracking-tight">섹터 지표</h1>
          <p className="text-sm text-muted-foreground">
            GICS 11개 섹터 ETF · 주요 산업 ETF의 기간별 성과
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="정렬 방식"
            className="rounded-md border border-border bg-transparent px-2 py-1.5 text-xs text-muted-foreground"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  period === p.key
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isError ? (
        <div className="p-6 text-sm text-red-500">
          섹터 데이터 로드 실패:{' '}
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              GICS 섹터
            </h2>
            <DataTable
              table={sectorTable}
              rowKey="ticker"
              isLoading={isLoading}
              skeletonRows={11}
              scrollX
              animateRows
              mobileCard
              emptyMessage="섹터 데이터가 없습니다."
            />
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              산업 / 테마
            </h2>
            <DataTable
              table={industryTable}
              rowKey="ticker"
              isLoading={isLoading}
              skeletonRows={6}
              scrollX
              animateRows
              mobileCard
              emptyMessage="산업 ETF 데이터가 없습니다."
            />
          </section>
        </div>
      )}
    </main>
  );
}
