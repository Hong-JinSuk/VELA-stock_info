import type {
  CommunityBoardType,
  RatingWritePolicy,
} from '@/generated/prisma/client';

// 글/댓글 작성자 표시 정보 (nickname ?? name 우선).
export type CommunityAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

// 사용 후기 1건. 본인/관리 여부는 클라가 useSession으로 author.id·role과 비교해 판단.
export type ReviewItem = {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  author: CommunityAuthor;
  commentCount: number;
  createdAt: string; // ISO (KST 벽시계 값)
  updatedAt: string;
};

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

// 보드 설정 (관리탭에서 별점 권한·댓글 깊이 노출). 후기 페이지가 별점 입력 노출 판단에도 사용.
export type BoardSettings = {
  key: string;
  title: string;
  type: CommunityBoardType;
  enableRating: boolean;
  ratingWritePolicy: RatingWritePolicy;
  commentMaxDepth: number;
};
