import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getBoardByType, postInclude, toPostItem } from '@/lib/community/board';
import prisma from '@/lib/prisma';
import { communityBoardTypeSchema } from '@/schemas/community-schema';
import { getServerSession } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/community/posts/mine?type= — 내 글(없으면 null). 1인 1개 보드(후기)의 폼 모드 판단에 사용.
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

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json(null);

  const board = await getBoardByType(parsedType.data);
  const post = await prisma.communityPost.findFirst({
    where: { boardId: board.id, userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: postInclude(session.user.id),
  });
  return NextResponse.json(post ? toPostItem(post) : null);
}
