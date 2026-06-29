import { getReviewsBoard } from '@/lib/community/board';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/community/reviews/stats — 후기 평점 집계(공개). 페이지네이션과 무관한 전체 평균.
export async function GET() {
  const board = await getReviewsBoard();
  const agg = await prisma.communityPost.aggregate({
    where: { boardId: board.id, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return NextResponse.json({
    ratingAverage: agg._avg.rating ?? 0, // 별점 있는 후기들의 평균(없으면 0)
    ratingCount: agg._count.rating, // 별점이 매겨진 후기 수
  });
}
