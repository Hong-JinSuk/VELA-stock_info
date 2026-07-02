import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { paginatedResponse, readPagination } from '@/lib/api/pagination';
import { getBoardByType, postInclude, toPostItem } from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import {
  communityBoardTypeSchema,
  createPostSchema,
  feedbackCategorySchema,
} from '@/schemas/community-schema';
import { getServerSession } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/community/posts?type=&page=&size=&category= — 보드 글 목록(공개, 최신순).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsedType = communityBoardTypeSchema.safeParse(sp.get('type'));
  if (!parsedType.success) {
    return NextResponse.json(
      { message: '보드 타입이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const board = await getBoardByType(parsedType.data);
  const pagination = readPagination(sp, { defaultSize: 20 });

  const categoryRaw = sp.get('category');
  const category = categoryRaw
    ? feedbackCategorySchema.safeParse(categoryRaw)
    : null;
  const where = {
    boardId: board.id,
    ...(category?.success ? { category: category.data } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: postInclude(session?.user?.id ?? ''),
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
    paginatedResponse(rows.map(toPostItem), total, pagination),
  );
}

// POST /api/community/posts — 글 작성(로그인). singlePostPerUser 보드면 1인 1개.
// 별점은 보드 정책 통과 시만, category는 FEEDBACK에서만 반영.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const userId = session.user.id;
  const isAdmin = (session.user.role ?? 'FREE') === 'ADMIN';

  const parsed = createPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const board = await getBoardByType(parsed.data.type);

  if (board.singlePostPerUser) {
    const existing = await prisma.communityPost.findFirst({
      where: { boardId: board.id, userId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { message: '이미 작성한 글이 있습니다.' },
        { status: 409 },
      );
    }
  }

  const canRate =
    board.enableRating && (board.ratingWritePolicy === 'ALL' || isAdmin);
  const rating = canRate ? (parsed.data.rating ?? null) : null;
  const category =
    board.type === 'FEEDBACK' ? (parsed.data.category ?? 'ETC') : null;
  const now = kstNow();

  const post = await prisma.communityPost.create({
    data: {
      boardId: board.id,
      userId,
      title: parsed.data.title,
      content: parsed.data.content,
      rating,
      category,
      createdAt: now,
      updatedAt: now,
    },
    include: postInclude(userId),
  });
  return NextResponse.json(toPostItem(post), { status: 201 });
}
