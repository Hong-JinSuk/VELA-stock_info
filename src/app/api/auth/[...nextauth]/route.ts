import prisma from '@/lib/prisma';
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
      // 1. 소셜 로그인 최초 가입 시 (NextAuth가 account를 줄 때)
      if (account) {
        token.provider = account.provider;
      }

      // 2. 유저가 로그인하는 순간 (user 객체는 무조건 들어옴)
      if (user) {
        const { password, ...safeUser } = user;
        token = { ...token, ...safeUser };

        // 기존 유저라서 account를 못 받았을 경우 강제 조회, Auth는 첫 가입시에만 제공하기 때문!
        if (!token.provider) {
          // 유저 ID로 Account 테이블을 뒤져서 어떤 소셜인지 알아낼 수 있음.
          const dbAccount = await prisma.account.findFirst({
            where: { userId: user.id },
          });

          if (dbAccount) {
            token.provider = dbAccount.provider; // "google" 등
          } else if (user.password) {
            token.provider = 'credentials'; // Account가 없는데 비번이 있다? 이메일 로그인!
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const { iat, exp, jti, sub, picture, ...userData } = token;
        (session.user as any) = { ...session.user, ...userData };
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
