import { z } from 'zod';

// 비밀번호 규칙: 8자 이상, 영문, 숫자, 특수문자(@$!%*?&) 포함
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])/;

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(20, '비밀번호는 최대 20자 이하여야 합니다')
    .regex(
      passwordRegex,
      '비밀번호는 영문, 숫자, 특수문자를 하나씩은 포함해야 합니다.',
    ),
});

export type LoginSchema = z.infer<typeof loginSchema>;
