import { capture } from '@/lib/analytics';
import { api } from '@/lib/api/axios';
import type { FavoriteItem, FavoriteType } from '@/types/favorite';
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

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
// 낙관적 업데이트: API 응답을 기다리지 않고 즉시 캐시에서 제거 → 목록/별표에 바로 반영.
// 실패하면 롤백 + 전역 에러 토스트, 성공/실패 무관하게 마지막에 invalidate로 서버와 reconcile.
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  type Vars = { type: FavoriteType; itemKey: string };
  type Ctx = { previous: Array<[QueryKey, FavoriteItem[] | undefined]> };
  return useMutation<Vars, Error, Vars, Ctx>({
    mutationFn: async (input) => {
      await api.delete(
        `/favorites?type=${input.type}&itemKey=${encodeURIComponent(input.itemKey)}`,
      );
      return input;
    },
    onMutate: async (input) => {
      // 진행 중인 favorites refetch를 멈춰 낙관적 값이 덮어쓰이지 않게.
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      // 전체/타입별 등 모든 favorites 캐시 스냅샷(롤백용).
      const previous = queryClient.getQueriesData<FavoriteItem[]>({
        queryKey: ['favorites'],
      });
      queryClient.setQueriesData<FavoriteItem[]>(
        { queryKey: ['favorites'] },
        (old) =>
          old
            ? old.filter(
                (f) => !(f.type === input.type && f.itemKey === input.itemKey),
              )
            : old,
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (input) => {
      capture('favorite_removed', { itemType: input.type, itemKey: input.itemKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
