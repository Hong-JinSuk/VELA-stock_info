import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// POST /api/community/posts/[id]/like — 공감 토글(로그인). 보드 enableLike일 때만.
// 응답: { liked, likeCount } — 낙관적 업데이트 reconcile용.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: postId } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, board: { select: { enableLike: true } } },
  });
  if (!post) {
    return NextResponse.json({ message: '글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (!post.board.enableLike) {
    return NextResponse.json(
      { message: '공감할 수 없는 글입니다.' },
      { status: 400 },
    );
  }

  const existing = await prisma.communityPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  let liked: boolean;
  if (existing) {
    await prisma.communityPostLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.communityPostLike.create({
      data: { postId, userId, createdAt: kstNow() },
    });
    liked = true;
  }
  const likeCount = await prisma.communityPostLike.count({ where: { postId } });
  return NextResponse.json({ liked, likeCount });
}
