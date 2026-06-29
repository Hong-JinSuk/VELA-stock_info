import { requireAdmin } from '@/lib/auth/guards';
import { getReviewsBoard, toBoardSettings } from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import { updateBoardSettingsSchema } from '@/schemas/community-schema';
import { NextResponse } from 'next/server';

// GET /api/community/board — 사용 후기 보드 설정(공개). 후기 페이지가 별점 입력 노출 판단에 사용.
export async function GET() {
  const board = await getReviewsBoard();
  return NextResponse.json(toBoardSettings(board));
}

// PATCH /api/community/board — 보드 설정 변경(ADMIN). 별점 작성 권한·댓글 깊이.
export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.res;

  const parsed = updateBoardSettingsSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const board = await getReviewsBoard();
  const { ratingWritePolicy, commentMaxDepth } = parsed.data;
  const updated = await prisma.communityBoard.update({
    where: { id: board.id },
    data: {
      ...(ratingWritePolicy !== undefined ? { ratingWritePolicy } : {}),
      ...(commentMaxDepth !== undefined ? { commentMaxDepth } : {}),
      updatedAt: kstNow(),
    },
  });
  return NextResponse.json(toBoardSettings(updated));
}
