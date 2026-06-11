import type { ReactNode } from 'react';
import type { Row, RowData, Table } from '@tanstack/react-table';

// TanStack Table의 meta를 확장(module augmentation)해서,
// row 동작/컬럼 표시 옵션을 columnDef와 같은 자리(useReactTable)에서 정의하게 한다.
// 이렇게 하면 DataTable 본체를 수정하지 않고도 동작을 주입할 수 있다.
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    /** row 클릭 시 동작 (예: detail 이동). 없으면 클릭 비활성. */
    onRowClick?: (row: Row<TData>) => void;
    /** row hover 시 동작 (예: detail prefetch). 시각적 bg 변화는 CSS로 자동. */
    onRowHover?: (row: Row<TData> | null) => void;
  }

  // TData/TValue는 TanStack 원본 ColumnMeta와 선언 병합 시그니처를 맞추기 위해 필요.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** 셀/헤더 가로 정렬. 기본 left. */
    align?: 'left' | 'center' | 'right';
    /** 헤더(th)에 추가할 className. */
    headerClassName?: string;
    /** 데이터 셀(td)에 추가할 className. */
    cellClassName?: string;
  }
}

export type DataTableProps<TData> = {
  /** caller가 useReactTable로 만든 인스턴스를 그대로 주입 (TanStack 전 기능 사용 가능). */
  table: Table<TData>;
  /**
   * 각 row의 React key로 쓸 데이터 필드명 (예: 13f → 'cik').
   * 지정하면 `row.original[rowKey]`를 key로 사용 → 페이지 전환 시 key 안정.
   * 미지정 시 TanStack의 `row.id`(기본 index) 사용.
   */
  rowKey?: keyof TData;
  /**
   * 가로 스크롤 허용 여부.
   * - false(기본): 컨테이너 폭에 컬럼을 비율(%)로 맞춤 → 가로 스크롤 없음.
   * - true: 컬럼을 픽셀 고정폭으로 두고 넘치면 가로 스크롤.
   */
  scrollX?: boolean;
  /** 모든 row 고정 높이(px). 콘텐츠가 달라도 동일 높이 유지. */
  rowHeight?: number;
  /** 로딩 중이면 스켈레톤 row 표시. */
  isLoading?: boolean;
  /** 스켈레톤 row 개수. 기본 10. */
  skeletonRows?: number;
  /** 데이터 0건일 때 표시할 내용. */
  emptyMessage?: ReactNode;
  /**
   * 페이지네이션 푸터 표시 여부.
   * 미지정 시 table이 페이징 구성됐으면(manualPagination 또는 pagination row model) 자동 표시.
   */
  showPagination?: boolean;
  /** 페이지 크기 선택 옵션. 주면 size 선택 UI 표시. */
  pageSizeOptions?: number[];
  className?: string;
};
