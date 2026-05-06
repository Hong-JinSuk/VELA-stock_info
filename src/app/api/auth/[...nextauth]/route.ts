import prisma from '@/lib/prisma';
import { ROLE_LIMITS } from '@/types/user';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import type { AuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  // CredentialsProvider는 DB 세션 못 씀 → JWT 필수
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    // NaverProvider({
    //   clientId: process.env.NAVER_ID || '',
    //   clientSecret: process.env.NAVER_SECRET || '',
    //   allowDangerousEmailAccountLinking: true,
    // }),
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
        return safeUser as any;
      },
      // async authorize(credentials) {
      //   if (!credentials?.email || !credentials?.password) return null;

      //   const user = await prisma.user.findUnique({
      //     where: { email: credentials.email as string },
      //   });

      //   // 유저가 없거나, 소셜로만 가입해서 비밀번호가 없는 경우 방어
      //   if (!user || !user.password) {
      //     return null;
      //   }

      //   const isValid = await bcrypt.compare(
      //     credentials.password as string,
      //     user.password,
      //   );

      //   // 보안상 비밀번호 제거후 return
      //   if (isValid) {
      //     const { password, ...safeUser } = user;
      //     return safeUser as any;
      //   }

      //   return null; // 비밀번호가 틀린 경우
      // },
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
          const cycleEnd = new Date(now);
          cycleEnd.setMonth(cycleEnd.getMonth() + 1);

          await prisma.userUsage.create({
            data: {
              userId: user.id,
              maxLimit: ROLE_LIMITS['FREE'],
              usedCount: 0,
              cycleStart: now,
              cycleEnd,
            },
          });
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const { iat, exp, jti, sub, picture, ...userData } = token;
        (session.user as any) = {
          ...session.user,
          ...userData,
          // token.id가 없는 기존 세션은 NextAuth가 보장하는 sub로 보완
          id: userData.id ?? sub,
        };

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
            const cycleEnd = new Date(now);
            cycleEnd.setMonth(cycleEnd.getMonth() + 1);
            usage = await prisma.userUsage.upsert({
              where: { userId },
              create: {
                userId,
                maxLimit: ROLE_LIMITS['FREE'],
                usedCount: 0,
                cycleStart: now,
                cycleEnd,
              },
              update: {},
            });
          }

          (session.user as any).usage = usage;
        }
      }
      return session;
    },
  },
  // callbacks: {
  //   async jwt({ token, user, account }) {
  //     // 특정 데이터만 넘겨주고 싶을 때, 쓰는 방법
  //     // if (user) {
  //     //   token.id = user.id;
  //     //   token.createdAt = user.createdAt;
  //     // }

  //     // password를 제외한 데이터를 넘겨줌
  //     if (user) {
  //       const { password, ...safeUser } = user;

  //       if (!token.provider) {
  //         // 유저 ID로 Account 테이블을 뒤져서 어떤 소셜인지 알아냅니다.
  //         const dbAccount = await prisma.account.findFirst({
  //           where: { userId: user.id },
  //         });

  //         if (dbAccount) {
  //           token.provider = dbAccount.provider; // "google" 등
  //         } else if (user.password) {
  //           token.provider = 'credentials'; // Account가 없는데 비번이 있다? 이메일 로그인!
  //         }
  //       }
  //       return { ...token, ...safeUser };
  //     }
  //     if (account) {
  //       console.log(
  //         '🌟 [JWT 콜백] account 들어옴! provider:',
  //         account.provider,
  //       );
  //       token.provider = account.provider;
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     const { iat, exp, jti, sub, ...userData } = token;
  //     if (session.user) {
  //       // 특정 데이터만 넘겨주고 싶을 때, 쓰는 방법
  //       // (session.user as any).id = token.id;
  //       // (session.user as any).role = token.role;
  //       // (session.user as any).createdAt = token.createdAt;
  //       (session.user as any) = { ...session.user, ...userData };
  //     }
  //     return session;
  //   },
  // },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
