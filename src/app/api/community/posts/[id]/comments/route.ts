import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  authorSelect,
  buildCommentTree,
  toAuthor,
} from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { createCommentSchema } from '@/schemas/community-schema';
import type { CommentNode } from '@/types/community';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// GET /api/community/posts/[id]/comments — 해당 글 댓글 트리(공개, bare array).
// 한 글의 전체 스레드는 bounded이므로 페이지네이션 envelope 미적용.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await prisma.communityComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: authorSelect } },
  });
  return NextResponse.json(buildCommentTree(rows));
}

// POST /api/community/posts/[id]/comments — 댓글/대댓글 작성(로그인). 깊이는 글이 속한 보드 설정 이내.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: postId } = await params;
  const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, board: { select: { commentMaxDepth: true } } },
  });
  if (!post) {
    return NextResponse.json({ message: '글을 찾을 수 없습니다.' }, { status: 404 });
  }

  let depth = 1;
  const { parentId, content } = parsed.data;
  if (parentId) {
    const parent = await prisma.communityComment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true, depth: true },
    });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json(
        { message: '원본 댓글을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    depth = parent.depth + 1;
    if (depth > post.board.commentMaxDepth) {
      return NextResponse.json(
        { message: '더 이상 답글을 달 수 없습니다.' },
        { status: 400 },
      );
    }
  }

  const now = kstNow();
  const created = await prisma.communityComment.create({
    data: {
      postId,
      userId,
      parentId: parentId ?? null,
      content,
      depth,
      createdAt: now,
      updatedAt: now,
    },
    include: { user: { select: authorSelect } },
  });

  const node: CommentNode = {
    id: created.id,
    content: created.content,
    parentId: created.parentId,
    depth: created.depth,
    author: toAuthor(created.user),
    createdAt: created.createdAt.toISOString(),
    children: [],
  };
  return NextResponse.json(node, { status: 201 });
}
