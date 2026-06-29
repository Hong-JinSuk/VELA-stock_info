import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { paginatedResponse, readPagination } from '@/lib/api/pagination';
import {
  authorSelect,
  getReviewsBoard,
  toReviewItem,
} from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { createReviewSchema } from '@/schemas/community-schema';
import { Prisma } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

const postInclude = {
  user: { select: authorSelect },
  _count: { select: { comments: true } },
} satisfies Prisma.CommunityPostInclude;

// GET /api/community/reviews?page=&size= — 사용 후기 목록(공개, 최신순, 페이지네이션).
export async function GET(req: NextRequest) {
  const board = await getReviewsBoard();
  const pagination = readPagination(req.nextUrl.searchParams, {
    defaultSize: 20,
  });
  const where = { boardId: board.id };

  const [rows, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: postInclude,
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.size,
            take: pagination.size,
          }
        : {}),
    }),
    prisma.communityPost.count({ where }),
  ]);

  return NextResponse.json(
    paginatedResponse(rows.map(toReviewItem), total, pagination),
  );
}

// POST /api/community/reviews — 후기 작성(로그인). 1인 1후기. 별점은 보드 정책 통과 시만 반영.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const userId = session.user.id;
  const isAdmin = (session.user.role ?? 'FREE') === 'ADMIN';

  const parsed = createReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const board = await getReviewsBoard();
  const canRate =
    board.enableRating && (board.ratingWritePolicy === 'ALL' || isAdmin);
  const rating = canRate ? (parsed.data.rating ?? null) : null;
  const now = kstNow();

  try {
    const post = await prisma.communityPost.create({
      data: {
        boardId: board.id,
        userId,
        title: parsed.data.title,
        content: parsed.data.content,
        rating,
        createdAt: now,
        updatedAt: now,
      },
      include: postInclude,
    });
    return NextResponse.json(toReviewItem(post), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { message: '이미 작성한 후기가 있습니다.' },
        { status: 409 },
      );
    }
    throw e;
  }
}
