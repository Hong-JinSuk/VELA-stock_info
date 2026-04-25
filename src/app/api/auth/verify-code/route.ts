import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { code: 400, message: '이메일과 인증 코드를 입력해주세요.' },
        { status: 400 },
      );
    }

    const record = await prisma.emailVerification.findFirst({
      where: { email, code, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json(
        { code: 400, message: '인증 코드가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { code: 400, message: '인증 코드가 만료되었습니다.' },
        { status: 400 },
      );
    }

    // 인증 완료 처리
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return NextResponse.json({
      code: 200,
      message: '이메일 인증이 완료되었습니다.',
    });
  } catch (error) {
    console.error('verify-code error:', error);
    return NextResponse.json(
      { code: 500, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
