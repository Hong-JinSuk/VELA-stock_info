// 개인화 즐겨찾기 타입. Prisma enum(FavoriteType)과 값을 일치시켜 둔다.
// (클라 번들에 generated client를 끌어오지 않도록 여기서 union을 직접 정의)
export const FAVORITE_TYPES = [
  'STOCK',
  'THIRTEENF_FILER',
  'INDICATOR',
  'SECTOR',
] as const;
export type FavoriteType = (typeof FAVORITE_TYPES)[number];

// API 응답/클라에서 쓰는 즐겨찾기 1건 DTO.
export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  itemKey: string; // STOCK=symbol, THIRTEENF_FILER=cik, INDICATOR=Indicator.id, SECTOR=ETF ticker
  label: string | null;
  memo: string | null;
  sortOrder: number;
  createdAt: string; // ISO
};
