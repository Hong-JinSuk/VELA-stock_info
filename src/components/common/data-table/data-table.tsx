'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type Column, flexRender } from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import DataTablePagination from './data-table-pagination';
import type { DataTableProps } from './types';

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_SKELETON_ROWS = 10;

function alignClass(align?: 'left' | 'center' | 'right') {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

// scrollX=false: 비율(%) 폭 → 컨테이너에 맞춰 가로 스크롤 없음 (table-fixed).
// scrollX=true: 픽셀 고정폭 + min-width → 넘치면 컨테이너가 가로 스크롤.
function colWidthStyle<TData>(
  col: Column<TData, unknown>,
  scrollX: boolean,
  totalSize: number,
): CSSProperties {
  const size = col.getSize();
  if (scrollX) return { width: size, minWidth: size };
  return { width: `${(size / totalSize) * 100}%` };
}

export default function DataTable<TData>({
  table,
  rowKey,
  scrollX = false,
  rowHeight = DEFAULT_ROW_HEIGHT,
  isLoading = false,
  skeletonRows = DEFAULT_SKELETON_ROWS,
  emptyMessage = '데이터가 없습니다.',
  showPagination,
  pageSizeOptions,
  className,
}: DataTableProps<TData>) {
  const { onRowClick, onRowHover } = table.options.meta ?? {};
  const leafColumns = table.getAllLeafColumns();
  const totalSize = table.getTotalSize();
  const rows = table.getRowModel().rows;
  const colCount = leafColumns.length;

  const paginated =
    showPagination ??
    (table.options.manualPagination === true ||
      Boolean(table.options.getPaginationRowModel));

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {/* 세로 스크롤 영역: 헤더는 sticky로 이 영역 상단에 고정, body만 스크롤. */}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          scrollX ? 'overflow-x-auto' : 'overflow-x-hidden',
        )}
      >
        {/* shadcn Table 내부 컨테이너 overflow 무력화 → 스크롤은 위 div 한 곳에서만. */}
        <Table
          containerClassName="overflow-x-visible"
          className={cn(scrollX ? 'w-max min-w-full' : 'table-fixed')}
        >
          <colgroup>
            {leafColumns.map((col) => (
              <col
                key={col.id}
                style={colWidthStyle(col, scrollX, totalSize)}
              />
            ))}
          </colgroup>

          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const { align, headerClassName } =
                    header.column.columnDef.meta ?? {};
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(alignClass(align), headerClassName)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, ri) => (
                <TableRow key={`sk-${ri}`} style={{ height: rowHeight }}>
                  {leafColumns.map((col) => (
                    <TableCell key={col.id} style={{ height: rowHeight }}>
                      <Skeleton className="h-4 w-2/3" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  style={{ height: rowHeight }}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={rowKey ? String(row.original[rowKey]) : row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  style={{ height: rowHeight }}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onMouseEnter={onRowHover ? () => onRowHover(row) : undefined}
                  onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const { align, cellClassName } =
                      cell.column.columnDef.meta ?? {};
                    return (
                      <TableCell
                        key={cell.id}
                        style={{ height: rowHeight }}
                        className={cn(
                          'overflow-hidden',
                          alignClass(align),
                          cellClassName,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginated && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}
