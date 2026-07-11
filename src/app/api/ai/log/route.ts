// src/app/api/ai/log/route.ts
import { ApiResponse, createResponse } from '@/lib/api/response'; // 경로 확인 필요
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // 규격에 맞춰 에러 반환 (result는 null이나 빈 객체)
      return createResponse('인증되지 않은 사용자입니다.', 401, null);
    }

    const { stockName, queryData, refineData, resultData } = await req.json();

    // 2. DB 로그 기록
    const log = await prisma.aiLog.create({
      data: {
        userId: session.user.id,
        actionType: 'PREDICT',
        ticker: stockName,
        queryData,
        refineData,
        resultData,
      },
    });

    // 규격 적용: message, status, result
    return createResponse('로그가 성공적으로 기록되었습니다.', 201, {
      logId: log.id,
    });
  } catch (error) {
    console.error('[AI_LOG] failed:', error);

    // 에러 발생 시에도 동일한 규격 유지
    return createResponse(
      error instanceof Error
        ? error.message
        : '알 수 없는 서버 오류가 발생했습니다.',
      500,
      null,
    );
  }
}
