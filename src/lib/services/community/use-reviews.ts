import { api } from '@/lib/api/axios';
import type { PaginatedResponse } from '@/lib/api/pagination';
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from '@/schemas/community-schema';
import type { ReviewItem, ReviewStats } from '@/types/community';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const REVIEWS_KEY = ['community', 'reviews'];

// 사용 후기 목록(공개, 최신순, 페이지네이션).
export function useReviews(page = 1, size = 20) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, page, size],
    queryFn: async (): Promise<PaginatedResponse<ReviewItem>> => {
      const { data } = await api.get<PaginatedResponse<ReviewItem>>(
        '/community/reviews',
        { params: { page, size } },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

// 후기 평점 집계(전체 평균). 후기 변경 시 함께 무효화되도록 REVIEWS_KEY 하위 키 사용.
export function useReviewStats() {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'stats'],
    queryFn: async (): Promise<ReviewStats> => {
      const { data } = await api.get<ReviewStats>('/community/reviews/stats');
      return data;
    },
  });
}

// 내 후기(없으면 null). 1인 1후기라 폼 모드(작성/수정) 판단에 사용.
export function useMyReview(enabled = true) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'mine'],
    queryFn: async (): Promise<ReviewItem | null> => {
      const { data } = await api.get<ReviewItem | null>(
        '/community/reviews/mine',
      );
      return data;
    },
    enabled,
  });
}

// 후기 작성(1인 1후기). 이미 있으면 서버가 409.
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput): Promise<ReviewItem> => {
      const { data } = await api.post<ReviewItem>('/community/reviews', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

// 후기 수정(본인 또는 ADMIN).
export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateReviewInput & { id: string }): Promise<ReviewItem> => {
      const { data } = await api.patch<ReviewItem>(
        `/community/reviews/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

// 후기 삭제(본인 또는 ADMIN).
export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/community/reviews/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
