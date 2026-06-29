import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  authorSelect,
  getReviewsBoard,
  toReviewItem,
} from '@/lib/community/board';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const postInclude = {
  user: { select: authorSelect },
  _count: { select: { comments: true } },
} satisfies Prisma.CommunityPostInclude;

// GET /api/community/reviews/mine — 내 후기(없으면 null). 1인 1후기라 폼 모드 판단에 사용.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(null);

  const board = await getReviewsBoard();
  const post = await prisma.communityPost.findUnique({
    where: { boardId_userId: { boardId: board.id, userId: session.user.id } },
    include: postInclude,
  });
  return NextResponse.json(post ? toReviewItem(post) : null);
}
