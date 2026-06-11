// GET 응답 페이지네이션 표준.
// 모든 GET(목록) 응답은 PaginatedResponse 형태를 따른다.
// 페이지네이션하지 않는 응답은 page/size를 NO_PAGINATION(-1)로 둔다.
// (신규 GET 훅을 만들 땐 페이징 필요 여부를 사용자에게 먼저 물어볼 것 — CLAUDE.md 참고)

export const NO_PAGINATION = -1;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// page/size가 있을 때의 페이지네이션 정보.
export type Pagination = { page: number; size: number };

// 표준 GET 목록 응답.
export type PaginatedResponse<T> = {
  items: T[];
  total: number; // 조건에 맞는 전체 건수 (현재 페이지가 아니라 총합)
  page: number; // 1-based. 페이지네이션 안 하면 -1 (NO_PAGINATION)
  size: number; // 페이지당 개수. 페이지네이션 안 하면 -1 (NO_PAGINATION)
};

/**
 * searchParams에서 page/size를 읽는다.
 * page/size가 둘 다 없으면 null(= 페이지네이션 안 함 = 전체).
 */
export function readPagination(
  sp: URLSearchParams,
  { defaultSize = DEFAULT_PAGE_SIZE, maxSize = MAX_PAGE_SIZE } = {},
): Pagination | null {
  if (!sp.has('page') && !sp.has('size')) return null;
  const page = Math.max(
    DEFAULT_PAGE,
    Number.parseInt(sp.get('page') ?? String(DEFAULT_PAGE), 10),
  );
  const size = Math.min(
    maxSize,
    Math.max(1, Number.parseInt(sp.get('size') ?? String(defaultSize), 10)),
  );
  return { page, size };
}

/**
 * 표준 응답 빌더. pagination이 null이면 page/size를 -1로 채운다.
 *   paginatedResponse(items, total, { page, size }) // 페이징됨
 *   paginatedResponse(items, items.length, null)    // 페이징 안 함 → page/size: -1
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  pagination: Pagination | null,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page: pagination?.page ?? NO_PAGINATION,
    size: pagination?.size ?? NO_PAGINATION,
  };
}
