import { z } from 'zod';

const minRoleEnum = z.enum([
  'GUEST',
  'FREE',
  'BASIC',
  'PRO',
  'MAX',
  'TESTER',
  'ADMIN',
]);

const menuTypeEnum = z.enum(['FOLDER', 'LINK', 'POPUP']);

// 메뉴 생성. key는 서버가 생성(요청에 없음). parentId가 없으면 대분류.
export const createMenuSchema = z.object({
  title: z.string().min(1, '메뉴 이름을 입력하세요.'),
  path: z.string().min(1, '경로를 입력하세요.'),
  icon: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  type: menuTypeEnum.optional(),
  disabled: z.boolean().optional(),
  minRole: minRoleEnum.optional(),
  hidden: z.boolean().optional(),
  beta: z.boolean().optional(),
  locked: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

// 메뉴 수정(부분). 최소 1개 필드 필요.
export const updateMenuSchema = z
  .object({
    title: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    icon: z.string().optional().nullable(),
    badge: z.string().optional().nullable(),
    type: menuTypeEnum.optional(),
    disabled: z.boolean().optional(),
    minRole: minRoleEnum.optional(),
    hidden: z.boolean().optional(),
    beta: z.boolean().optional(),
    locked: z.boolean().optional(),
    parentId: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: '변경할 값이 없습니다.',
  });

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
