'use client';
// useReactTable 인스턴스를 다루므로 React Compiler 제외 (13f 페이지와 동일 규칙).
'use no memo';

import {
  thirteenFColumns,
  thirteenFFavoriteColumn,
} from '@/app/(main)/market-data/13f/columns';
import DataTable from '@/components/common/data-table/data-table';
import { useThirteenFByCiks } from '@/lib/services/market/use-thirteenf-by-ciks';
import type { ThirteenFListItem } from '@/types/thirteenf';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

// 13F 리스트 컬럼 앞에 즐겨찾기 별표 컬럼을 붙여 재사용.
const columns: ColumnDef<ThirteenFListItem>[] = [
  thirteenFFavoriteColumn,
  ...thirteenFColumns,
];

// 즐겨찾기한 13F 기관을 실제 13F 리스트와 동일한 리치 테이블로 렌더.
export default function FavoriteThirteenFTable({ ciks }: { ciks: string[] }) {
  const router = useRouter();
  const { data, isLoading } = useThirteenFByCiks(ciks);

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onRowClick: (row) => {
        const { accession } = row.original;
        if (accession) router.push(`/market-data/13f/${accession}`);
      },
    },
  });

  return (
    <DataTable
      table={table}
      rowKey="cik"
      rowHeight={88}
      scrollX
      showPagination={false}
      isLoading={isLoading}
      mobileCard
    />
  );
}
