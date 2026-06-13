'use client';
// TanStack table 인스턴스는 같은 참조를 유지한 채 내부 상태만 바뀌므로
// React Compiler memoization과 충돌(부분 갱신 누락) → 이 파일은 컴파일러 제외.
'use no memo';

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
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import DataTablePagination from './data-table-pagination';
import type { DataTableProps } from './types';

// animateRows용 motion 버전 TableRow (스타일은 TableRow 그대로 유지).
const MotionTableRow = motion.create(TableRow);

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_SKELETON_ROWS = 10;

function alignClass(align?: 'left' | 'center' | 'right') {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

// 항상 table-fixed. scrollX=false: 비율(%) 폭 → 컨테이너에 맞춰 가로 스크롤 없음.
// scrollX=true: 픽셀 폭 + 테이블 min-width=totalSize → 컨테이너가 충분히 넓으면
// 여분 공간이 비율대로 분배돼 스크롤바 없음, 좁을 때만 가로 스크롤 발생.
function colWidthStyle<TData>(
  col: Column<TData, unknown>,
  scrollX: boolean,
  totalSize: number,
): CSSProperties {
  const size = col.getSize();
  if (scrollX) return { width: size };
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
  animateRows = false,
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
          'scrollbar-subtle min-h-0 flex-1 overflow-y-auto',
          scrollX ? 'overflow-x-auto' : 'overflow-x-hidden',
        )}
      >
        {/* shadcn Table 내부 컨테이너 overflow 무력화 → 스크롤은 위 div 한 곳에서만. */}
        <Table
          containerClassName="overflow-x-visible"
          className="table-fixed"
          style={scrollX ? { minWidth: totalSize } : undefined}
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
              rows.map((row) => {
                const key = rowKey ? String(row.original[rowKey]) : row.id;
                const rowProps = {
                  'data-state': row.getIsSelected() ? 'selected' : undefined,
                  style: { height: rowHeight },
                  className: cn(onRowClick && 'cursor-pointer'),
                  onClick: onRowClick ? () => onRowClick(row) : undefined,
                  onMouseEnter: onRowHover
                    ? () => onRowHover(row)
                    : undefined,
                  onMouseLeave: onRowHover
                    ? () => onRowHover(null)
                    : undefined,
                };
                const cells = row.getVisibleCells().map((cell) => {
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
                });
                // animateRows: key(FLIP 식별자)가 같은 행이 위치만 바뀌면 부드럽게 이동.
                return animateRows ? (
                  <MotionTableRow
                    key={key}
                    layout
                    transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                    {...rowProps}
                  >
                    {cells}
                  </MotionTableRow>
                ) : (
                  <TableRow key={key} {...rowProps}>
                    {cells}
                  </TableRow>
                );
              })
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
