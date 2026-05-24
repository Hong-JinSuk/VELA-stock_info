import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// gemini-server cron이 매일 form.idx에서 받아와 ThirteenFFiler 테이블에 upsert.
// 자동완성 dropdown용 — 클라이언트가 React Query로 받아 캐시한 뒤 substring filter.
export async function GET() {
  const filers = await prisma.thirteenFFiler.findMany({
    select: { cik: true, name: true, lastFiledDate: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(
    { filers },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    },
  );
}
