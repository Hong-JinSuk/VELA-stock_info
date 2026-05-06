import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ai, errorMessage } from '@/lib/ai/gemini';
import { getPredictPrompt } from '@/lib/ai/prompts';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const userId = (session.user as any).id as string;

    // 2. Usage 조회
    const usage = await prisma.userUsage.findUnique({ where: { userId } });
    if (!usage) {
      return NextResponse.json(
        { message: '사용량 정보를 찾을 수 없습니다.' },
        { status: 403 },
      );
    }

    // 3. 주기 만료 시 자동 리셋
    const now = new Date();
    if (usage.cycleEnd < now) {
      const newCycleEnd = new Date(usage.cycleEnd);
      newCycleEnd.setMonth(newCycleEnd.getMonth() + 1);
      await prisma.userUsage.update({
        where: { userId },
        data: {
          usedCount: 0,
          cycleStart: usage.cycleEnd,
          cycleEnd: newCycleEnd,
        },
      });
      usage.usedCount = 0;
    }

    // 4. 사용 한도 확인 (-1은 무제한)
    if (usage.maxLimit !== -1 && usage.usedCount >= usage.maxLimit) {
      return NextResponse.json(
        { message: '이번 달 사용 횟수를 모두 소진했습니다.' },
        { status: 429 },
      );
    }

    // 5. 예측 실행
    const { stockName, refinedData } = await request.json();

    if (!stockName) {
      return NextResponse.json(
        { message: '종목명이 필요합니다.' },
        { status: 400 },
      );
    }

    console.log('============ Start Predict ============');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: getPredictPrompt(stockName, refinedData ?? ''),
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk.text;
    }

    console.log('============ End Predict ============');

    const startIndex = fullText.indexOf('{');
    const endIndex = fullText.lastIndexOf('}');

    let cleanText: string;
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      cleanText = fullText.substring(startIndex, endIndex + 1);
    } else {
      cleanText = fullText
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    const result = JSON.parse(cleanText);

    if (result.isValidStock === false) {
      return NextResponse.json(
        { message: '유효하지 않은 종목이거나 분석할 수 없습니다.' },
        { status: 400 },
      );
    }

    // 6. 사용량 증가 (atomic)
    await prisma.userUsage.update({
      where: { userId },
      data: { usedCount: { increment: 1 } },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Predict Route Error:', error);

    const status = error.response?.status || error.status || 500;
    const message = errorMessage[status] || '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        message,
        debug:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status },
    );
  }
}
