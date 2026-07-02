import { getBoardByType } from '@/lib/community/board';
import prisma from '@/lib/prisma';
import { communityBoardTypeSchema } from '@/schemas/community-schema';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/community/posts/stats?type= — 평점 집계(공개). 페이지네이션과 무관한 전체 평균.
export async function GET(req: NextRequest) {
  const parsedType = communityBoardTypeSchema.safeParse(
    req.nextUrl.searchParams.get('type'),
  );
  if (!parsedType.success) {
    return NextResponse.json(
      { message: '보드 타입이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const board = await getBoardByType(parsedType.data);
  const agg = await prisma.communityPost.aggregate({
    where: { boardId: board.id, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return NextResponse.json({
    ratingAverage: agg._avg.rating ?? 0, // 별점 있는 글들의 평균(없으면 0)
    ratingCount: agg._count.rating, // 별점이 매겨진 글 수
  });
}
