'use client';
// useReactTable 인스턴스를 다루므로 React Compiler 제외 (13f 페이지와 동일 규칙).
'use no memo';

import DataTable from '@/components/common/data-table/data-table';
import { thirteenFColumns } from '@/app/(main)/market/13f/columns';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { SAMPLE_13F } from './sample-data';

// 13F 고래 추적 데모 — 실제 13F 컬럼(섹터 바·스파크라인·운용자산)을 샘플 데이터로 재현.
export default function ThirteenFDemo() {
  const table = useReactTable({
    data: SAMPLE_13F,
    columns: thirteenFColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      table={table}
      rowKey="cik"
      rowHeight={88}
      scrollX
      showPagination={false}
    />
  );
}
