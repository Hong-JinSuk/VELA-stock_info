import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SECTOR_ETFS } from '@/constants/sector-etfs';
import prisma from '@/lib/prisma';
import { addFavoriteSchema } from '@/schemas/favorite-schema';
import { FAVORITE_TYPES, type FavoriteItem, type FavoriteType } from '@/types/favorite';
import { canUsePersonalization, getFavoriteLimit } from '@/types/user';
import type { Favorite } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

function toItem(f: Favorite): FavoriteItem {
  return {
    id: f.id,
    type: f.type,
    itemKey: f.itemKey,
    label: f.label,
    memo: f.memo,
    sortOrder: f.sortOrder,
    createdAt: f.createdAt.toISOString(),
  };
}

// itemKey가 실제 도메인 엔티티로 존재하는지 확인 (폴리모픽이라 DB FK 대신 앱에서 검증).
async function itemExists(type: FavoriteType, itemKey: string): Promise<boolean> {
  switch (type) {
    case 'STOCK': {
      const row = await prisma.stockSymbol.findUnique({
        where: { symbol: itemKey },
        select: { symbol: true },
      });
      return Boolean(row);
    }
    case 'THIRTEENF_FILER': {
      const row = await prisma.thirteenFFiler.findUnique({
        where: { cik: itemKey },
        select: { cik: true },
      });
      return Boolean(row);
    }
    case 'INDICATOR': {
      const row = await prisma.indicator.findUnique({
        where: { id: itemKey },
        select: { id: true },
      });
      return Boolean(row);
    }
    case 'SECTOR':
      // 섹터는 전용 테이블이 없고 SECTOR_ETFS 고정셋으로 식별(itemKey = ETF ticker).
      return SECTOR_ETFS.some((e) => e.ticker === itemKey);
    default:
      return false;
  }
}

function parseType(value: string | null): FavoriteType | undefined {
  return value && (FAVORITE_TYPES as readonly string[]).includes(value)
    ? (value as FavoriteType)
    : undefined;
}

// GET /api/favorites?type=STOCK — 내 즐겨찾기 목록 (type 생략 시 전체).
// bounded(티어 한도) 목록이라 페이지네이션 없이 bare array로 반환.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const role = session.user.role ?? 'FREE';
  if (!canUsePersonalization(role)) {
    return NextResponse.json(
      { message: '개인화(즐겨찾기)는 유료 플랜에서 사용할 수 있어요.' },
      { status: 403 },
    );
  }

  const type = parseType(req.nextUrl.searchParams.get('type'));
  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id, ...(type ? { type } : {}) },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(rows.map(toItem));
}

// POST /api/favorites — 추가/갱신. 유료 게이팅 + 티어 한도 + 존재 검증.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const role = session.user.role ?? 'FREE';
  if (!canUsePersonalization(role)) {
    return NextResponse.json(
      { message: '개인화(즐겨찾기)는 유료 플랜에서 사용할 수 있어요.' },
      { status: 403 },
    );
  }

  const parsed = addFavoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const { type, itemKey, label, memo } = parsed.data;
  const userId = session.user.id;

  if (!(await itemExists(type, itemKey))) {
    return NextResponse.json(
      { message: '존재하지 않는 항목입니다.' },
      { status: 404 },
    );
  }

  // 신규 추가일 때만 티어 한도 체크 (이미 담긴 항목 갱신은 개수 증가 없음).
  const existing = await prisma.favorite.findUnique({
    where: { userId_type_itemKey: { userId, type, itemKey } },
    select: { id: true },
  });
  if (!existing) {
    const limit = getFavoriteLimit(role);
    if (limit !== -1) {
      const count = await prisma.favorite.count({ where: { userId } });
      if (count >= limit) {
        return NextResponse.json(
          { message: `즐겨찾기 한도(${limit}개)를 초과했습니다.` },
          { status: 403 },
        );
      }
    }
  }

  const fav = await prisma.favorite.upsert({
    where: { userId_type_itemKey: { userId, type, itemKey } },
    create: { userId, type, itemKey, label, memo },
    update: { label, memo },
  });
  return NextResponse.json(toItem(fav), { status: 201 });
}

// DELETE /api/favorites?type=STOCK&itemKey=AAPL — 복합 키로 삭제(멱등).
// 강등된 유저도 정리할 수 있도록 유료 게이팅은 적용하지 않음.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const type = parseType(sp.get('type'));
  const itemKey = sp.get('itemKey');
  if (!type || !itemKey) {
    return NextResponse.json(
      { message: 'type, itemKey가 필요합니다.' },
      { status: 400 },
    );
  }
  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, type, itemKey },
  });
  return NextResponse.json({ type, itemKey });
}
