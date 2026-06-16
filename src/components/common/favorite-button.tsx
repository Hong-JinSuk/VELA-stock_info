'use client';

import {
  useAddFavorite,
  useRemoveFavorite,
} from '@/lib/services/favorites/use-favorite-mutation';
import { useFavorites } from '@/lib/services/favorites/use-favorites';
import { cn } from '@/lib/utils';
import type { FavoriteType } from '@/types/favorite';
import { Star } from 'lucide-react';

// 공용 즐겨찾기 토글 버튼. 종목·13F 등 어떤 FavoriteType에도 쓸 수 있다.
// 같은 type의 버튼들은 useFavorites(type) 쿼리를 공유(react-query dedup)해 fetch 1회.
// 유료/한도 위반은 서버가 403 + 메시지를 주고 axios 인터셉터가 toast로 표시.
export default function FavoriteButton({
  type,
  itemKey,
  label,
  size = 18,
  className,
}: {
  type: FavoriteType;
  itemKey: string;
  label?: string;
  size?: number;
  className?: string;
}) {
  const { data } = useFavorites(type);
  const isFavorited = data?.some((f) => f.itemKey === itemKey) ?? false;
  const add = useAddFavorite();
  const remove = useRemoveFavorite();
  const pending = add.isPending || remove.isPending;

  const onClick = (e: React.MouseEvent) => {
    // 행 클릭(네비게이션) 등과 분리.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    if (isFavorited) remove.mutate({ type, itemKey });
    else add.mutate({ type, itemKey, label });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors',
        'text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500',
        isFavorited && 'text-amber-500',
        pending && 'opacity-50',
        className,
      )}
    >
      <Star
        style={{ width: size, height: size }}
        className={isFavorited ? 'fill-amber-500' : undefined}
      />
    </button>
  );
}
