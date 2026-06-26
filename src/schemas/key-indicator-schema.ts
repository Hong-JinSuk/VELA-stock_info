import { z } from 'zod';

// 중요 지표 추가: indicatorId = Indicator.id (catalog 내부 ID, 예: "ust_10y").
export const addKeyIndicatorSchema = z.object({
  indicatorId: z.string().min(1).max(60),
});

export type AddKeyIndicatorInput = z.infer<typeof addKeyIndicatorSchema>;
