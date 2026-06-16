export type UserRole = 'FREE' | 'BASIC' | 'PRO' | 'MAX' | 'ADMIN' | 'TESTER';

// AI 사용 정책
// FREE    2회  / 1주일 주기
// BASIC  20회  / 1달 주기
// PRO    50회  / 1달 주기
// MAX    10회  / 1시간 주기 (시간당 최대 10회)
// ADMIN  무제한 (-1)
// TESTER 무제한 (-1)
export const ROLE_LIMITS: Record<UserRole, number> = {
  FREE: 2,
  BASIC: 20,
  PRO: 50,
  MAX: 10,
  ADMIN: -1,
  TESTER: -1,
};

// 개인화(즐겨찾기) 정책 — 유료(BASIC 이상) 전용, 티어별 개수 차등.
// -1 = 무제한. FREE는 0 → 기능 자체 비활성.
export const FAVORITE_LIMITS: Record<UserRole, number> = {
  FREE: 0,
  BASIC: 30,
  PRO: 100,
  MAX: -1,
  ADMIN: -1,
  TESTER: -1,
};

// 개인화 기능 사용 가능 여부 (FREE만 차단).
export function canUsePersonalization(role: UserRole): boolean {
  return FAVORITE_LIMITS[role] !== 0;
}

// 해당 역할의 즐겨찾기 최대 개수 (-1 = 무제한).
export function getFavoriteLimit(role: UserRole): number {
  return FAVORITE_LIMITS[role];
}

// FREE: 1주 / MAX: 1시간 / 그 외: 1달
export function getNextCycleEnd(role: UserRole, from: Date): Date {
  const end = new Date(from);
  if (role === 'FREE') {
    end.setDate(end.getDate() + 7);
  } else if (role === 'MAX') {
    end.setHours(end.getHours() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export type User = {
  id: string;
  email: string;
  emailVerified: Date | null; // 추가
  name: string | null;
  nickname: string | null;
  image: string | null;
  password: string | null;
  gender: string | null;
  birthday: string | null;
  ageRange: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;

  usage?: UserUsage | null;
  // 추후에 Role 추가해줘야함
};

export type Account = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

export type Session = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
};

export type UserWithAccounts = User & {
  accounts: Account[];
};

export type UserUsage = {
  id: string;
  userId: string;
  maxLimit: number;
  usedCount: number;
  cycleStart: Date;
  cycleEnd: Date;
  updatedAt: Date;
};
