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
import { type Column, type Row, flexRender } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { type CSSProperties, useEffect, useRef } from 'react';
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
  mobileCard,
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

  // 페이지가 바뀌면 스크롤 영역을 최상단으로 리셋 (새 페이지는 위에서부터 보이게).
  // 페이지네이션 없는 테이블은 pageIndex가 0에 고정이라 마운트 시 1회만(무해) 실행.
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageIndex = table.getState().pagination.pageIndex;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pageIndex]);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {/* 세로 스크롤 영역: 헤더는 sticky로 이 영역 상단에 고정, body만 스크롤. */}
      <div
        ref={scrollRef}
        className={cn(
          'scrollbar-subtle min-h-0 flex-1 overflow-y-auto',
          scrollX ? 'overflow-x-auto' : 'overflow-x-hidden',
        )}
      >
        {/* mobileCard가 켜지면 데스크톱에서만 표를 보이고, 모바일은 아래 카드로 대체. */}
        <div className={cn(mobileCard && 'hidden sm:block')}>
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

        {/* 모바일(<640px): 표 대신 행별 카드. mobileCard가 켜진 표만. */}
        {mobileCard && (
          <div className="flex flex-col gap-2 sm:hidden">
            {isLoading ? (
              Array.from({ length: Math.min(skeletonRows, 4) }).map((_, i) => (
                <Skeleton key={`mc-sk-${i}`} className="h-40 rounded-xl" />
              ))
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              rows.map((row) => {
                const key = rowKey ? String(row.original[rowKey]) : row.id;
                const onClick = onRowClick
                  ? () => onRowClick(row)
                  : undefined;
                return (
                  <div
                    key={key}
                    onClick={onClick}
                    className={cn(
                      'rounded-xl border border-border p-4',
                      onClick && 'cursor-pointer hover:bg-accent/30',
                    )}
                  >
                    {typeof mobileCard === 'function'
                      ? mobileCard(row)
                      : <AutoMobileCard row={row} />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {paginated && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}

// 자동 모바일 카드 — 컬럼 정의(meta)로부터 제목/액션/본문(라벨:값)을 만든다.
// 제목=meta.mobileTitle(없으면 첫 컬럼), 우상단=meta.mobileHeaderAction,
// 숨김=meta.mobileHidden, 라벨=meta.mobileLabel ?? header(문자열).
function AutoMobileCard<TData>({ row }: { row: Row<TData> }) {
  const cells = row.getVisibleCells();
  const titleCell =
    cells.find((c) => c.column.columnDef.meta?.mobileTitle) ?? cells[0];
  const actionCell = cells.find(
    (c) => c.column.columnDef.meta?.mobileHeaderAction,
  );
  const bodyCells = cells.filter(
    (c) =>
      c.id !== titleCell?.id &&
      c.id !== actionCell?.id &&
      !c.column.columnDef.meta?.mobileHidden,
  );
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        {titleCell && (
          <div className="min-w-0 flex-1">
            {flexRender(
              titleCell.column.columnDef.cell,
              titleCell.getContext(),
            )}
          </div>
        )}
        {actionCell && (
          <div className="shrink-0">
            {flexRender(
              actionCell.column.columnDef.cell,
              actionCell.getContext(),
            )}
          </div>
        )}
      </div>
      {bodyCells.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          {bodyCells.map((c) => {
            const { meta, header } = c.column.columnDef;
            const label =
              meta?.mobileLabel ??
              (typeof header === 'string' ? header : '');
            return (
              <div
                key={c.id}
                className={cn(
                  'flex min-w-0 flex-col gap-0.5',
                  meta?.mobileFullWidth && 'col-span-2',
                )}
              >
                {label && (
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                )}
                <dd className="min-w-0 text-sm">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </>
  );
}
