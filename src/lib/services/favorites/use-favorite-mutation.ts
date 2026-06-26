import { capture } from '@/lib/analytics';
import { api } from '@/lib/api/axios';
import type { FavoriteItem, FavoriteType } from '@/types/favorite';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type AddFavoriteInput = {
  type: FavoriteType;
  itemKey: string;
  label?: string;
  memo?: string;
};

// 즐겨찾기 추가/갱신. 성공 시 모든 favorites 쿼리 무효화.
export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddFavoriteInput): Promise<FavoriteItem> => {
      const { data } = await api.post<FavoriteItem>('/favorites', input);
      return data;
    },
    onSuccess: (_data, input) => {
      capture('favorite_added', { itemType: input.type, itemKey: input.itemKey });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// 즐겨찾기 제거 (복합 키, 멱등).
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: FavoriteType; itemKey: string }) => {
      await api.delete(
        `/favorites?type=${input.type}&itemKey=${encodeURIComponent(input.itemKey)}`,
      );
      return input;
    },
    onSuccess: (input) => {
      capture('favorite_removed', { itemType: input.type, itemKey: input.itemKey });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
