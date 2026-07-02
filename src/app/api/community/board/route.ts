import { requireAdmin } from '@/lib/auth/guards';
import { getBoardByType, toBoardSettings } from '@/lib/community/board';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import {
  communityBoardTypeSchema,
  updateBoardSettingsSchema,
} from '@/schemas/community-schema';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/community/board?type= — 보드 설정(공개). 페이지가 별점/공감 노출 판단에 사용. 기본 REVIEW.
export async function GET(req: NextRequest) {
  const parsedType = communityBoardTypeSchema.safeParse(
    req.nextUrl.searchParams.get('type'),
  );
  const type = parsedType.success ? parsedType.data : 'REVIEW';
  const board = await getBoardByType(type);
  return NextResponse.json(toBoardSettings(board));
}

// PATCH /api/community/board — 보드 설정 변경(ADMIN). body의 type으로 대상 보드 선택.
// 별점 작성 권한(REVIEW)·댓글 깊이(공통)만 편집. enableLike/singlePostPerUser는 타입 불변.
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

  const { type, ratingWritePolicy, commentMaxDepth } = parsed.data;
  const board = await getBoardByType(type);
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
