import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// gemini-server cron이 매일 form.idx에서 받아와 ThirteenFFiler 테이블에 upsert.
// 자동완성 dropdown용 — 클라이언트가 React Query로 받아 캐시한 뒤 substring filter.
export async function GET() {
  try {
    const filers = await prisma.thirteenFFiler.findMany({
      select: { cik: true, name: true, lastFiledDate: true },
      orderBy: { name: 'asc' },
    });
    console.log(`[13F_FILERS] loaded ${filers.length} filers`);
    return NextResponse.json(
      { filers },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      },
    );
  } catch (error) {
    console.error('[13F_FILERS] failed:', error);
    return NextResponse.json(
      { message: '매니저 명단 조회 실패' },
      { status: 500 },
    );
  }
}
