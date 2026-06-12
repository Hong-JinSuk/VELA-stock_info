'use client';
// TanStack table 인스턴스는 같은 참조를 유지한 채 내부 상태만 바뀌므로
// React Compiler memoization과 충돌(부분 갱신 누락) → 이 파일은 컴파일러 제외.
'use no memo';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import type { Table } from '@tanstack/react-table';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  /** 페이지 크기 선택 옵션. 주면 size 선택 UI 표시. */
  pageSizeOptions?: number[];
  className?: string;
};

const ELLIPSIS = 'ellipsis' as const;
type PageItem = number | typeof ELLIPSIS;

// 1-based 페이지 번호 목록: 1 … (current-1) current (current+1) … last
function buildPageItems(current: number, count: number): PageItem[] {
  const MAX_PLAIN = 7; // 이 이하면 ellipsis 없이 전부 노출
  if (count <= MAX_PLAIN) {
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  if (start > 2) items.push(ELLIPSIS);
  for (let p = start; p <= end; p++) items.push(p);
  if (end < count - 1) items.push(ELLIPSIS);
  items.push(count);
  return items;
}

// table API(setPageIndex/previousPage/nextPage/setPageSize)만 사용
// → 서버(manualPagination)/클라 페이징 둘 다 동작.
export default function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const current = pageIndex + 1;
  const pageItems = pageCount > 0 ? buildPageItems(current, pageCount) : [];

  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-center gap-2 pt-3',
        className,
      )}
    >
      <Pagination className="w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="disabled:pointer-events-none disabled:opacity-50"
            />
          </PaginationItem>

          {pageItems.map((item, i) => (
            <PaginationItem key={item === ELLIPSIS ? `e-${i}` : item}>
              {item === ELLIPSIS ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={item === current}
                  onClick={() => table.setPageIndex(item - 1)}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="disabled:pointer-events-none disabled:opacity-50"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {pageCount > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const raw = new FormData(e.currentTarget).get('page');
            const n = Math.trunc(Number(raw));
            if (!Number.isFinite(n)) return;
            table.setPageIndex(Math.min(Math.max(1, n), pageCount) - 1);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          {/* key=current: 외부에서 페이지가 바뀌면 입력값을 현재 페이지로 리셋. */}
          <input
            key={current}
            name="page"
            type="number"
            min={1}
            max={pageCount}
            defaultValue={current}
            aria-label="페이지 직접 이동 (Enter)"
            className="w-14 rounded-md border border-border bg-transparent px-2 py-1.5 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="whitespace-nowrap">/ {pageCount}</span>
        </form>
      )}

      {pageSizeOptions && pageSizeOptions.length > 0 && (
        <select
          value={pageSize}
          onChange={(e) =>
            // 페이지 크기가 바뀌면 항상 1페이지부터 다시 본다.
            table.setPagination((old) => ({
              ...old,
              pageIndex: 0,
              pageSize: Number(e.target.value),
            }))
          }
          aria-label="페이지 크기"
          className="rounded-md border border-border bg-transparent px-2 py-1.5 text-xs text-muted-foreground"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}개씩
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
