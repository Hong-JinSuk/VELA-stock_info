// src/app/api/auth/check-email/route.ts
import { ApiResponse } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<boolean>>> {
  try {
    const { email } = await req.json();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: '이미 사용 중인 이메일입니다.', status: 409, result: true },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: '사용 가능한 이메일입니다.', status: 200, result: false },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.', status: 500, result: true },
      { status: 500 },
    );
  }
}
