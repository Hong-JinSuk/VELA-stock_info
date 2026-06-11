'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  /** 페이지 크기 선택 옵션. 주면 size 선택 UI 표시. */
  pageSizeOptions?: number[];
  className?: string;
};

// table API(previousPage/nextPage/setPageSize)만 사용 → 서버(manualPagination)/클라 페이징 둘 다 동작.
export default function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 pt-3',
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft className="size-4" />
        이전
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {pageCount > 0 ? pageIndex + 1 : 0} / {pageCount}
        </span>
        {pageSizeOptions && pageSizeOptions.length > 0 && (
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            aria-label="페이지 크기"
            className="rounded-md border border-border bg-transparent px-2 py-1 text-xs"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}개씩
              </option>
            ))}
          </select>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        다음
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
