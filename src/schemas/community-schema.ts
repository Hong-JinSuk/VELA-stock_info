import { z } from 'zod';

// 후기 작성 body. rating은 보드 ratingWritePolicy 통과 시에만 반영(아니면 라우트에서 무시).
export const createReviewSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// 후기 수정 body. rating에 null 허용(별점 해제). 최소 1개 필드 필요.
export const updateReviewSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: '변경할 값이 없습니다.' });
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// 댓글/대댓글 작성 body. parentId 있으면 대댓글(깊이는 라우트에서 계산·검증).
export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  parentId: z.string().min(1).optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// 보드 설정 변경 body (ADMIN). 최소 1개 필드 필요.
export const updateBoardSettingsSchema = z
  .object({
    ratingWritePolicy: z.enum(['ALL', 'ADMIN']).optional(),
    commentMaxDepth: z.number().int().min(1).max(3).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: '변경할 값이 없습니다.' });
export type UpdateBoardSettingsInput = z.infer<typeof updateBoardSettingsSchema>;
