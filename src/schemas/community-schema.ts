import { z } from 'zod';

export const communityBoardTypeSchema = z.enum(['REVIEW', 'FEEDBACK']);
export const feedbackCategorySchema = z.enum([
  'BUG',
  'FEATURE',
  'IMPROVEMENT',
  'ETC',
]);

// 글 작성 body(후기/건의사항 공통). type으로 보드를 지정한다.
// rating은 보드 ratingWritePolicy 통과 시에만 반영(아니면 라우트에서 무시).
// category는 FEEDBACK에서만 의미(REVIEW면 라우트에서 무시).
export const createPostSchema = z.object({
  type: communityBoardTypeSchema,
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  category: feedbackCategorySchema.optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

// 글 수정 body. rating에 null 허용(별점 해제). 최소 1개 필드 필요.
export const updatePostSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    category: feedbackCategorySchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: '변경할 값이 없습니다.' });
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// 댓글/대댓글 작성 body. parentId 있으면 대댓글(깊이는 라우트에서 계산·검증).
export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  parentId: z.string().min(1).optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// 보드 설정 변경 body (ADMIN). type으로 대상 보드 지정 + 최소 1개 설정 필드 필요.
// enableLike/singlePostPerUser는 타입 불변이라 편집 대상이 아니다.
export const updateBoardSettingsSchema = z
  .object({
    type: communityBoardTypeSchema,
    ratingWritePolicy: z.enum(['ALL', 'ADMIN']).optional(),
    commentMaxDepth: z.number().int().min(1).max(3).optional(),
  })
  .refine((d) => Object.keys(d).length > 1, {
    message: '변경할 값이 없습니다.',
  });
export type UpdateBoardSettingsInput = z.infer<typeof updateBoardSettingsSchema>;
