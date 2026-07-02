import type {
  CommunityBoardType,
  FeedbackCategory,
  RatingWritePolicy,
} from '@/generated/prisma/client';

export type { CommunityBoardType, FeedbackCategory } from '@/generated/prisma/client';

// 글/댓글 작성자 표시 정보 (nickname ?? name 우선).
export type CommunityAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

// 커뮤니티 글 1건(후기/건의사항 공통). 본인/관리 여부는 클라가 author.id·role과 비교해 판단.
export type PostItem = {
  id: string;
  title: string;
  content: string;
  rating: number | null; // 후기 별점 (건의사항은 null)
  category: FeedbackCategory | null; // 건의사항 분류 (후기는 null)
  author: CommunityAuthor;
  commentCount: number;
  likeCount: number; // 공감 수 (건의사항)
  likedByMe: boolean; // 현재 유저가 공감했는지 (비로그인은 false)
  createdAt: string; // ISO (KST 벽시계 값)
  updatedAt: string;
};

// 이전 이름 호환 alias.
export type ReviewItem = PostItem;

// 댓글 트리 노드 (children 재귀).
export type CommentNode = {
  id: string;
  content: string;
  parentId: string | null;
  depth: number;
  author: CommunityAuthor;
  createdAt: string;
  children: CommentNode[];
};

// 후기 평점 집계(전체). 헤더에 별 + 평균 표시.
export type ReviewStats = {
  ratingAverage: number; // 별점 있는 후기 평균(없으면 0)
  ratingCount: number; // 별점이 매겨진 후기 수
};

// 보드 설정. enableLike/singlePostPerUser는 타입 불변(구조적) 속성, 나머지는 admin 편집 대상.
export type BoardSettings = {
  key: string;
  title: string;
  type: CommunityBoardType;
  enableRating: boolean;
  ratingWritePolicy: RatingWritePolicy;
  enableLike: boolean;
  singlePostPerUser: boolean;
  commentMaxDepth: number;
};
