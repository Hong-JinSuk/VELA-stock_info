import { ai, errorMessage } from '@/lib/ai/gemini';
import { getRefinePrompt } from '@/lib/ai/prompts';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { stockData } = await request.json();

    if (!stockData) {
      return NextResponse.json(
        { message: '정제할 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: getRefinePrompt(stockData),
    });

    let refinedData = '';
    for await (const chunk of stream) {
      refinedData += chunk.text;
    }

    return NextResponse.json({ refinedData });
  } catch (error) {
    console.error('[REFINE] failed:', error);

    const err = error as {
      response?: { status?: number };
      status?: number;
      message?: string;
    };
    const status = err.response?.status || err.status || 500;
    const message = errorMessage[status] || '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        message,
        debug:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status },
    );
  }
}
