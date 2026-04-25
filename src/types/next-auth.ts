// types/next-auth.d.ts
import { User as MyUser } from '@/types/user'; // 기존 User 타입과 충돌 피하기 위해 별칭 사용
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    // DefaultSession["user"]와 내가 만든 MyUser 타입을 합칩니다.
    user: MyUser & DefaultSession['user'];
  }

  // DB에서 가져오는 기본 유저 객체의 타입도 내 타입으로 확장합니다.
  interface User extends MyUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends MyUser {}
}
