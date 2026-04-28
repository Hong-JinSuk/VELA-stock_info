import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/services/auth/mailer';
import { NextResponse } from 'next/server';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6자리
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { code: 400, message: '유효하지 않은 이메일입니다.' },
        { status: 400 },
      );
    }

    // 1분 이내 재요청 방지 (Rate limit)
    const recent = await prisma.emailVerification.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (recent) {
      return NextResponse.json(
        { code: 429, message: '1분 후 다시 요청해주세요.' },
        { status: 429 },
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60_000); // 5분

    // 기존 미인증 코드 무효화 후 새로 생성
    await prisma.emailVerification.deleteMany({
      where: { email, verified: false },
    });

    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    await sendVerificationEmail(email, code);
    return NextResponse.json({
      code: 200,
      message: '인증 코드가 발송되었습니다.',
    });
  } catch (error) {
    console.error('send-code error:', error);
    return NextResponse.json(
      { code: 500, message: '메일 발송에 실패했습니다.' },
      { status: 500 },
    );
  }
}
