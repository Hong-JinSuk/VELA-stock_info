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
