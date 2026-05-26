import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// TypeScript에서 global 객체에 prisma 속성을 추가하기 위한 타입 선언
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// PostgreSQL 연결 풀 및 Prisma 어댑터 생성
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 이미 생성된 PrismaClient가 있으면 그것을 사용하고, 없으면 새로 생성합니다.
// PRISMA_LOG=query면 쿼리까지 stdout 노출. 그 외엔 warn/error만.
// 운영에서 모든 SELECT/INSERT가 흐르면 로그 양이 폭증하므로 명시적 opt-in.
const prismaLog =
  process.env.PRISMA_LOG === 'query'
    ? (['query', 'warn', 'error'] as const)
    : (['warn', 'error'] as const);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // 최신 버전에 맞게 어댑터를 넘겨줍니다.
    log: [...prismaLog],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
