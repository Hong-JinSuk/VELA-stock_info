import { z } from 'zod';

// 섹터 생성: slug는 URL용(소문자/숫자/하이픈).
export const createSectorSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug는 소문자·숫자·하이픈만 사용합니다.'),
  name: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const updateSectorSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// 섹터에 종목/ETF 추가. note = 항목 설명(사용자 노출).
export const addSectorItemSchema = z.object({
  symbol: z.string().min(1).max(20),
  note: z.string().max(300).optional(),
});

// 항목 설명(note) 수정.
export const updateSectorItemSchema = z.object({
  symbol: z.string().min(1).max(20),
  note: z.string().max(300).nullable(),
});

export type CreateSectorInput = z.infer<typeof createSectorSchema>;
export type UpdateSectorInput = z.infer<typeof updateSectorSchema>;
export type AddSectorItemInput = z.infer<typeof addSectorItemSchema>;
export type UpdateSectorItemInput = z.infer<typeof updateSectorItemSchema>;
