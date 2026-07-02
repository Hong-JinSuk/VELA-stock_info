'use client';

import { Button } from '@/components/ui/button';
import { useToggleLike } from '@/lib/services/community/use-community-posts';
import { cn } from '@/lib/utils';
import type { CommunityBoardType } from '@/types/community';
import { ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

// 공감(좋아요) 토글 버튼. 가역 액션이라 낙관적 업데이트(useToggleLike)로 즉시 반영된다.
export default function LikeButton({
  type,
  postId,
  likeCount,
  likedByMe,
}: {
  type: CommunityBoardType;
  postId: string;
  likeCount: number;
  likedByMe: boolean;
}) {
  const { data: session } = useSession();
  const canLike = Boolean(session?.user);
  const toggle = useToggleLike(type);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={!canLike}
      onClick={() => toggle.mutate(postId)}
      aria-pressed={likedByMe}
      title={canLike ? undefined : '로그인하면 공감할 수 있어요.'}
      className={cn(
        'gap-1.5 text-muted-foreground',
        likedByMe && 'text-blue-500 hover:text-blue-500',
      )}
    >
      <ThumbsUp className={cn('size-3.5', likedByMe && 'fill-current')} />
      공감 {likeCount}
    </Button>
  );
}
