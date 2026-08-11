import { z } from 'zod';

// 개발자에게 보내는 문의 메일(POST /mail) 본문 스키마.
// 사이드바(로그인 유저)와 welcome 문의 섹션(비로그인 방문자)이 함께 사용한다.
export const contactSchema = z.object({
  author: z
    .string()
    .trim()
    .min(1, '이름을 입력해주세요.')
    .max(50, '이름은 50자 이하로 입력해주세요.'),
  authorEmail: z
    .email('유효한 이메일 주소를 입력해주세요.')
    .max(254, '이메일이 너무 깁니다.'),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(120, '제목은 120자 이하로 입력해주세요.'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(5000, '내용은 5000자 이하로 입력해주세요.'),
  // 봇 트랩(honeypot). 화면에 보이지 않는 필드라 사람이 채울 일이 없다.
  website: z.string().optional(),
});

export type ContactSchema = z.infer<typeof contactSchema>;
