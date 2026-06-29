import type {
  CommunityBoard,
  CommunityComment,
} from '@/generated/prisma/client';
import { kstNow } from '@/lib/kst';
import prisma from '@/lib/prisma';
import type {
  BoardSettings,
  CommentNode,
  CommunityAuthor,
  ReviewItem,
} from '@/types/community';

export const REVIEWS_BOARD_KEY = 'reviews';

// 'reviews' 보드 보장(없으면 기본값으로 생성). 모든 후기 라우트의 진입점.
// (마이그레이션 시드 대신 lazy upsert — 보드는 1행 고정이라 idempotent 보장이 단순/안전.)
export async function getReviewsBoard(): Promise<CommunityBoard> {
  const now = kstNow();
  return prisma.communityBoard.upsert({
    where: { key: REVIEWS_BOARD_KEY },
    create: {
      key: REVIEWS_BOARD_KEY,
      title: '사용 후기',
      type: 'REVIEW',
      enableRating: true,
      ratingWritePolicy: 'ADMIN',
      commentMaxDepth: 2,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
    update: {},
  });
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

export function toAuthor(u: AuthorRow): CommunityAuthor {
  return { id: u.id, name: u.nickname ?? u.name, image: u.image };
}

export function toReviewItem(p: {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
  user: AuthorRow;
  _count: { comments: number };
}): ReviewItem {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    rating: p.rating,
    author: toAuthor(p.user),
    commentCount: p._count.comments,
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
