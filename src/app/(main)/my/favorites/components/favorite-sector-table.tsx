'use client';
// useReactTable 인스턴스를 다루므로 React Compiler 제외 (섹터 페이지와 동일 규칙).
'use no memo';

import { buildSectorColumns } from '@/app/(main)/market-data/sectors/columns';
import DataTable from '@/components/common/data-table/data-table';
import type { SectorPerformance } from '@/types/sector';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

// 즐겨찾기한 섹터만 섹터 페이지와 동일한 테이블로 렌더 (별표 컬럼으로 바로 해제 가능).
export default function FavoriteSectorTable({
  sectors,
}: {
  sectors: SectorPerformance[];
}) {
  const table = useReactTable({
    data: sectors,
    columns: buildSectorColumns('d1'),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable table={table} rowKey="ticker" scrollX showPagination={false} />
  );
}
