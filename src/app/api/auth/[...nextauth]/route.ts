import prisma from '@/lib/prisma';
import { getNextCycleEnd, ROLE_LIMITS, UserRole } from '@/types/user';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { AuthOptions, User } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import NaverProvider from 'next-auth/providers/naver';

// 네이버 프로필 응답 타입 (체크된 항목만 응답에 포함됨)
type NaverProfileResponse = {
  response: {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
    gender?: string;
    birthday?: string;
    age?: string;
    birthyear?: string;
    mobile?: string;
  };
};

// nickname 중복 시 _<UUID8> 형태로 회피
async function resolveUniqueNickname(
  raw: string | undefined,
): Promise<string | null> {
  if (!raw) return null;
  const existing = await prisma.user.findUnique({ where: { nickname: raw } });
  if (!existing) return raw;
  return `${raw}_${randomUUID().slice(0, 8)}`;
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  // 디버깅용 — 원인 확인 후 제거 예정
  debug: true,

  // CredentialsProvider는 DB 세션 못 씀 → JWT 필수
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    NaverProvider({
      clientId: process.env.NAVER_OAUTH_ID || '',
      clientSecret: process.env.NAVER_OAUTH_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      async profile(profile: NaverProfileResponse) {
        const res = profile.response;
        const nickname = await resolveUniqueNickname(res.nickname);

        return {
          id: res.id,
          email: res.email ?? '',
          name: res.name ?? null,
          nickname,
          image: res.profile_image ?? null,
          gender: res.gender ?? null,
          birthday: res.birthday ?? null,
          ageRange: res.age ?? null,
        } as unknown as User; // PrismaAdapter는 추가 필드도 user 테이블에 그대로 저장함
      },
    }),
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID || '',
    //   clientSecret: process.env.GITHUB_SECRET || '',
    //   allowDangerousEmailAccountLinking: true,
    // }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 모두 입력해주세요.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { usage: true },
        });

        // 🚨 1. 유저가 없거나, 소셜로만 가입해서 비밀번호가 없는 경우 분기 처리
        if (!user || !user.password) {
          // 보안상 조금 더 안전하게 가려면 "가입되지 않았거나 소셜 로그인 계정입니다." 정도로 안내할 수 있습니다.
          throw new Error(
            '존재하지 않는 계정이거나 소셜 로그인으로 가입된 계정입니다.',
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        // 🚨 2. 비밀번호가 틀린 경우 분기 처리
        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }

        // 성공 시 (보안상 비밀번호 제거 후 return)
        const { password, ...safeUser } = user;
        return safeUser as unknown as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.provider = account.provider;
      }

      if (user) {
        const { password, ...safeUser } = user;
        token = { ...token, ...safeUser };

        if (!token.provider) {
          const dbAccount = await prisma.account.findFirst({
            where: { userId: user.id },
          });

          if (dbAccount) {
            token.provider = dbAccount.provider;
          } else if (user.password) {
            token.provider = 'credentials';
          }
        }

        // OAuth 유저는 signup API를 거치지 않아 UserUsage가 없을 수 있음 → 자동 생성
        const existingUsage = await prisma.userUsage.findUnique({
          where: { userId: user.id },
        });

        if (!existingUsage) {
          const now = new Date();
          const role = (user as { role?: UserRole }).role ?? 'FREE';
          await prisma.userUsage.create({
            data: {
              userId: user.id,
              maxLimit: ROLE_LIMITS[role],
              usedCount: 0,
              cycleStart: now,
              cycleEnd: getNextCycleEnd(role, now),
            },
          });
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // JWT 전용 클레임(iat/exp/jti/picture)은 session.user에 섞지 않도록 분리해서 버린다.
        const { iat, exp, jti, sub, picture, ...userData } = token;
        session.user = {
          ...session.user,
          ...userData,
          // token.id가 없는 기존 세션은 NextAuth가 보장하는 sub로 보완
          id: userData.id ?? sub ?? '',
        } as typeof session.user;

        // token.id: 로그인 시 safeUser에서 주입 / token.sub: NextAuth가 항상 보장하는 유저 ID
        const userId = (token.id ?? token.sub) as string | undefined;
        if (userId) {
          let usage = await prisma.userUsage.findUnique({
            where: { userId },
          });

          // 기존 유저(마이그레이션 전 가입)는 usage가 없을 수 있음 → 최초 세션 조회 시 자동 생성
          // upsert: 동시 요청으로 인한 중복 생성 에러 방지
          if (!usage) {
            const now = new Date();
            const role = (token.role as UserRole) ?? 'FREE';
            usage = await prisma.userUsage.upsert({
              where: { userId },
              create: {
                userId,
                maxLimit: ROLE_LIMITS[role],
                usedCount: 0,
                cycleStart: now,
                cycleEnd: getNextCycleEnd(role, now),
              },
              update: {},
            });
          }

          session.user.usage = usage;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
