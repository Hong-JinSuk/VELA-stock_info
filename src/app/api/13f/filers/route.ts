import { thirteenFStaleCutoff } from '@/constants/13f-stale';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

// 자동완성 dropdown용 서버 사이드 검색.
// 입력 검색어(searchKey)로 name 또는 krName 부분일치 → 최대 limit개 반환.
// searchKey 비어있으면 빈 결과 (전체 9k건 통째로 안 보냄).

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const searchKey = (sp.get('searchKey') ?? '').trim();
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(sp.get('limit') ?? `${DEFAULT_LIMIT}`, 10)),
  );

  if (!searchKey) {
    return NextResponse.json({ filers: [] });
  }

  try {
    const where: Prisma.ThirteenFFilerWhereInput = {
      // 1년 이상 13F 보고가 없는 filer(활동 중단)는 자동완성에서도 제외 (목록과 동일 기준).
      lastFiledDate: { gte: thirteenFStaleCutoff() },
      OR: [
        { name: { contains: searchKey, mode: 'insensitive' } },
        { krName: { contains: searchKey, mode: 'insensitive' } },
        { krNickname: { contains: searchKey, mode: 'insensitive' } },
      ],
    };

    const filers = await prisma.thirteenFFiler.findMany({
      where,
      select: {
        cik: true,
        name: true,
        krName: true,
        krNickname: true,
        lastFiledDate: true,
      },
      orderBy: [{ lastFiledDate: 'desc' }, { name: 'asc' }],
      take: limit,
    });

    console.log(`[13F_FILERS] searchKey="${searchKey}" returned=${filers.length}`);
    return NextResponse.json({ filers });
  } catch (error) {
    console.error('[13F_FILERS] failed:', error);
    return NextResponse.json(
      { message: '매니저 명단 조회 실패' },
      { status: 500 },
    );
  }
}
