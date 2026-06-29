import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// DELETE /api/community/comments/[id] — 댓글 삭제(본인 또는 ADMIN). 대댓글은 onDelete Cascade.
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
  const existing = await prisma.communityComment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
  }

  await prisma.communityComment.delete({ where: { id } });
  return NextResponse.json({ id });
}
