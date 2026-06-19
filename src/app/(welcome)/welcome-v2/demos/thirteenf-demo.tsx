'use client';
// useReactTable 인스턴스를 다루므로 React Compiler 제외 (13f 페이지와 동일 규칙).
'use no memo';

import DataTable from '@/components/common/data-table/data-table';
import { thirteenFColumns } from '@/app/(main)/market-data/13f/columns';
import type { ThirteenFListItem } from '@/types/thirteenf';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { SAMPLE_13F } from './sample-data';

// 데모에선 가로 스크롤을 피하려고 대표 컬럼만 추린다(실제 페이지는 전체 컬럼).
const DEMO_COLUMN_KEYS = new Set([
  'filerName',
  'aum',
  'qoq',
  'trend',
  'sectors',
]);

const demoColumns = thirteenFColumns.filter((col) => {
  const key = col.id ?? ('accessorKey' in col ? String(col.accessorKey) : '');
  return DEMO_COLUMN_KEYS.has(key);
});

// 13F 고래 추적 데모 — 실제 13F 컬럼(섹터 바·스파크라인·운용자산)을 샘플 데이터로 재현.
export default function ThirteenFDemo() {
  const table = useReactTable<ThirteenFListItem>({
    data: SAMPLE_13F,
    columns: demoColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      table={table}
      rowKey="cik"
      rowHeight={88}
      showPagination={false}
    />
  );
}
