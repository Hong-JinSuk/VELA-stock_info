import { api } from '@/lib/api/axios';
import type { CreateCommentInput } from '@/schemas/community-schema';
import type { CommentNode } from '@/types/community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const commentsKey = (postId: string) => ['community', 'comments', postId];

// 글 댓글 트리(공개, bare array). enabled로 펼쳤을 때만 조회.
export function usePostComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: commentsKey(postId),
    queryFn: async (): Promise<CommentNode[]> => {
      const { data } = await api.get<CommentNode[]>(
        `/community/posts/${postId}/comments`,
      );
      return data;
    },
    enabled,
  });
}

// 댓글/대댓글 작성. 성공 시 해당 글 댓글 + 글 목록(댓글 수) 무효화(모든 보드 타입).
export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<CommentNode> => {
      const { data } = await api.post<CommentNode>(
        `/community/posts/${postId}/comments`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

// 댓글 삭제(본인 또는 ADMIN).
export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/community/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}
