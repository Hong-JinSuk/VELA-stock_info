import {
  type CommunityBoard,
  type CommunityBoardType,
  type CommunityComment,
  type FeedbackCategory,
  Prisma,
} from '@/generated/prisma/client';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import type {
  BoardSettings,
  CommentNode,
  CommunityAuthor,
  PostItem,
} from '@/types/community';

// 보드 타입별 기본값 + 타입 불변 속성.
// enableRating/enableLike/singlePostPerUser는 보드 "타입"을 정의하는 구조적 속성이라
// admin이 바꾸지 않는다(불변). title/commentMaxDepth/ratingWritePolicy만 admin 편집 대상.
type BoardDefaults = {
  key: string;
  title: string;
  enableRating: boolean;
  ratingWritePolicy: 'ALL' | 'ADMIN';
  enableLike: boolean;
  singlePostPerUser: boolean;
  commentMaxDepth: number;
  sortOrder: number;
};

const BOARD_DEFAULTS: Record<CommunityBoardType, BoardDefaults> = {
  REVIEW: {
    key: 'reviews',
    title: '사용 후기',
    enableRating: true,
    ratingWritePolicy: 'ADMIN',
    enableLike: false,
    singlePostPerUser: true, // 1인 1후기
    commentMaxDepth: 2,
    sortOrder: 0,
  },
  FEEDBACK: {
    key: 'feedback',
    title: '건의사항',
    enableRating: false,
    ratingWritePolicy: 'ADMIN',
    enableLike: true, // 공감
    singlePostPerUser: false, // 1인 여러 개
    commentMaxDepth: 2,
    sortOrder: 1,
  },
};

// 해당 타입 보드 보장(없으면 기본값으로 생성). 모든 커뮤니티 라우트의 진입점.
// 조회는 findUnique 1회로 끝나고, 타입 불변 속성이 어긋난 기존 행(마이그레이션 직후 등)만 1회 보정한다.
export async function getBoardByType(
  type: CommunityBoardType,
): Promise<CommunityBoard> {
  const d = BOARD_DEFAULTS[type];
  const invariant = {
    type,
    enableRating: d.enableRating,
    enableLike: d.enableLike,
    singlePostPerUser: d.singlePostPerUser,
  };
  const now = kstNow();

  const existing = await prisma.communityBoard.findUnique({
    where: { key: d.key },
  });
  if (!existing) {
    return prisma.communityBoard.create({
      data: {
        key: d.key,
        title: d.title,
        ratingWritePolicy: d.ratingWritePolicy,
        commentMaxDepth: d.commentMaxDepth,
        sortOrder: d.sortOrder,
        createdAt: now,
        updatedAt: now,
        ...invariant,
      },
    });
  }
  const drift =
    existing.type !== type ||
    existing.enableRating !== d.enableRating ||
    existing.enableLike !== d.enableLike ||
    existing.singlePostPerUser !== d.singlePostPerUser;
  if (drift) {
    return prisma.communityBoard.update({
      where: { id: existing.id },
      data: { ...invariant, updatedAt: now },
    });
  }
  return existing;
}

// 작성자 표시 정보 (nickname 우선, 없으면 name).
type AuthorRow = {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
};

export const authorSelect = {
  id: true,
  name: true,
  nickname: true,
  image: true,
} as const;

// 글 목록/단건 공용 include. likes는 현재 유저 필터(likedByMe 판단), _count.likes는 전체 공감 수.
// 비로그인은 likeUserId가 빈 문자열이라 어떤 like와도 매칭되지 않아 likedByMe=false.
// Prisma.validator로 리터럴 타입을 보존해 findMany/create 결과에 relation이 정확히 추론되게 한다.
export const postInclude = (likeUserId: string) =>
  Prisma.validator<Prisma.CommunityPostInclude>()({
    user: { select: authorSelect },
    _count: { select: { comments: true, likes: true } },
    likes: { where: { userId: likeUserId }, select: { id: true } },
  });

export function toAuthor(u: AuthorRow): CommunityAuthor {
  return { id: u.id, name: u.nickname ?? u.name, image: u.image };
}

// 글 1건 → DTO. likes를 include(현재 유저 필터)하면 likedByMe가 채워진다.
export function toPostItem(p: {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  category: FeedbackCategory | null;
  createdAt: Date;
  updatedAt: Date;
  user: AuthorRow;
  _count: { comments: number; likes: number };
  likes?: { id: string }[];
}): PostItem {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    rating: p.rating,
    category: p.category,
    author: toAuthor(p.user),
    commentCount: p._count.comments,
    likeCount: p._count.likes,
    likedByMe: (p.likes?.length ?? 0) > 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toBoardSettings(b: CommunityBoard): BoardSettings {
  return {
    key: b.key,
    title: b.title,
    type: b.type,
    enableRating: b.enableRating,
    ratingWritePolicy: b.ratingWritePolicy,
    enableLike: b.enableLike,
    singlePostPerUser: b.singlePostPerUser,
    commentMaxDepth: b.commentMaxDepth,
  };
}

// 평면 댓글 목록(createdAt asc)을 트리로. 부모가 목록에 없으면 최상위로 승격(안전망).
export function buildCommentTree(
  rows: (CommunityComment & { user: AuthorRow })[],
): CommentNode[] {
  const map = new Map<string, CommentNode>();
  for (const c of rows) {
    map.set(c.id, {
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      depth: c.depth,
      author: toAuthor(c.user),
      createdAt: c.createdAt.toISOString(),
      children: [],
    });
  }
  const roots: CommentNode[] = [];
  for (const c of rows) {
    const node = map.get(c.id);
    if (!node) continue;
    const parent = c.parentId ? map.get(c.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
