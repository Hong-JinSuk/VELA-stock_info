import { FAVORITE_TYPES } from '@/types/favorite';
import { z } from 'zod';

// 즐겨찾기 추가 body. itemKey는 도메인 자연키(symbol/cik) — 존재 검증은 라우트에서.
export const addFavoriteSchema = z.object({
  type: z.enum(FAVORITE_TYPES),
  itemKey: z.string().min(1).max(64),
  label: z.string().max(120).optional(),
  memo: z.string().max(500).optional(),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
