export type User = {
  id: string;
  email: string;
  name: string;
  iamge?: string;
  createdAt: string;
  updatedAt: string;

  accounts: Account[];
};

export type Account = {
  id: string;
  userId: string; // FK
  type: string;
  provider: string;
  providerAccountId: string; // OAuth2가 부여한 해당 유저의 고유 ID
};
