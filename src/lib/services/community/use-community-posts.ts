import { api } from '@/lib/api/axios';
import type { PaginatedResponse } from '@/lib/api/pagination';
import type {
  CreatePostInput,
  UpdatePostInput,
} from '@/schemas/community-schema';
import type {
  CommunityBoardType,
  FeedbackCategory,
  PostItem,
  ReviewStats,
} from '@/types/community';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// 보드 타입별 쿼리 키. 하위 키(stats/mine/page…)가 이 prefix를 공유해 무효화가 함께 걸린다.
const postsKey = (type: CommunityBoardType) => ['community', 'posts', type];

// 글 목록(공개, 최신순, 페이지네이션). category는 FEEDBACK 필터.
export function usePosts(
  type: CommunityBoardType,
  page = 1,
  size = 20,
  category: FeedbackCategory | null = null,
) {
  return useQuery({
    queryKey: [...postsKey(type), page, size, category],
    queryFn: async (): Promise<PaginatedResponse<PostItem>> => {
      const { data } = await api.get<PaginatedResponse<PostItem>>(
        '/community/posts',
        { params: { type, page, size, ...(category ? { category } : {}) } },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

// 평점 집계(전체 평균). 글 변경 시 함께 무효화되도록 postsKey 하위 키 사용.
export function usePostStats(type: CommunityBoardType) {
  return useQuery({
    queryKey: [...postsKey(type), 'stats'],
    queryFn: async (): Promise<ReviewStats> => {
      const { data } = await api.get<ReviewStats>('/community/posts/stats', {
        params: { type },
      });
      return data;
    },
  });
}

// 내 글(없으면 null). 1인 1개 보드(후기)의 폼 모드(작성/수정) 판단에 사용.
export function useMyPost(type: CommunityBoardType, enabled = true) {
  return useQuery({
    queryKey: [...postsKey(type), 'mine'],
    queryFn: async (): Promise<PostItem | null> => {
      const { data } = await api.get<PostItem | null>('/community/posts/mine', {
        params: { type },
      });
      return data;
    },
    enabled,
  });
}

// 글 작성. singlePostPerUser 보드는 이미 있으면 서버가 409.
export function useCreatePost(type: CommunityBoardType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<CreatePostInput, 'type'>,
    ): Promise<PostItem> => {
      const { data } = await api.post<PostItem>('/community/posts', {
        type,
        ...input,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(type) }),
  });
}

// 글 수정(본인 또는 ADMIN).
export function useUpdatePost(type: CommunityBoardType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdatePostInput & { id: string }): Promise<PostItem> => {
      const { data } = await api.patch<PostItem>(
        `/community/posts/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(type) }),
  });
}

// 글 삭제(본인 또는 ADMIN).
export function useDeletePost(type: CommunityBoardType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/community/posts/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(type) }),
  });
}

// 공감 토글(가역 액션 → 낙관적 업데이트). 눌리면 즉시 반영, 실패 시 롤백, settle에 서버와 reconcile.
export function useToggleLike(type: CommunityBoardType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      postId: string,
    ): Promise<{ liked: boolean; likeCount: number }> => {
      const { data } = await api.post<{ liked: boolean; likeCount: number }>(
        `/community/posts/${postId}/like`,
      );
      return data;
    },
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: postsKey(type) });
      // 이 타입의 모든 목록 캐시(page/size/category별)를 함께 갱신.
      const prev = qc.getQueriesData<PaginatedResponse<PostItem>>({
        queryKey: postsKey(type),
      });
      qc.setQueriesData<PaginatedResponse<PostItem>>(
        { queryKey: postsKey(type) },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old; // stats/mine 캐시는 건너뜀
          return {
            ...old,
            items: old.items.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    likedByMe: !p.likedByMe,
                    likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
                  }
                : p,
            ),
          };
        },
      );
      return { prev };
    },
    onError: (_e, _postId, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: postsKey(type) }),
  });
}
