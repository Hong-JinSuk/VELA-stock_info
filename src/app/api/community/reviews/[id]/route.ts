import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  authorSelect,
  getReviewsBoard,
  toReviewItem,
} from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { updateReviewSchema } from '@/schemas/community-schema';
import { Prisma } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const postInclude = {
  user: { select: authorSelect },
  _count: { select: { comments: true } },
} satisfies Prisma.CommunityPostInclude;

// PATCH /api/community/reviews/[id] — 후기 수정(본인 또는 ADMIN). 별점 수정은 보드 정책 통과 시만.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const isAdmin = (session.user.role ?? 'FREE') === 'ADMIN';

  const { id } = await params;
  const parsed = updateReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: '후기를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
  }

  const board = await getReviewsBoard();
  const canRate =
    board.enableRating && (board.ratingWritePolicy === 'ALL' || isAdmin);
  const { title, content, rating } = parsed.data;

  const updated = await prisma.communityPost.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(rating !== undefined && canRate ? { rating } : {}),
      updatedAt: kstNow(),
    },
    include: postInclude,
  });
  return NextResponse.json(toReviewItem(updated));
}

// DELETE /api/community/reviews/[id] — 후기 삭제(본인 또는 ADMIN). 댓글은 onDelete Cascade.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const isAdmin = (session.user.role ?? 'FREE') === 'ADMIN';

  const { id } = await params;
  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: '후기를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
  }

  await prisma.communityPost.delete({ where: { id } });
  return NextResponse.json({ id });
}
