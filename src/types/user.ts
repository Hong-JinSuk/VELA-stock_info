export type UserRole = 'FREE' | 'BASIC' | 'PRO' | 'MAX' | 'ADMIN' | 'TESTER';

// -1은 무제한
export const ROLE_LIMITS: Record<UserRole, number> = {
  FREE: 1,
  BASIC: 15,
  PRO: 30,
  MAX: -1,
  ADMIN: -1,
  TESTER: -1,
};

export type User = {
  id: string;
  email: string;
  emailVerified: Date | null; // 추가
  name: string | null;
  nickname: string | null;
  image: string | null;
  password: string | null;
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
