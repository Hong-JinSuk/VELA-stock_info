'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatRelativeFromKstIso } from '@/lib/kst';
import { usePostComments } from '@/lib/services/community/use-community-comments';
import { useDeletePost } from '@/lib/services/community/use-community-posts';
import { cn } from '@/lib/utils';
import type { BoardSettings, PostItem } from '@/types/community';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import CommentThread from '../../components/comment-thread';
import CategoryBadge from '../../components/category-badge';
import LikeButton from '../../components/like-button';

export default function FeedbackCard({
  post,
  board,
  onEdit,
}: {
  post: PostItem;
  board: BoardSettings;
  onEdit: (post: PostItem) => void; // 수정은 페이지 전체 컴포저로 위임
}) {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const isAdmin = (session?.user?.role ?? 'FREE') === 'ADMIN';
  const isOwner = myId === post.author.id;
  const canEditText = isOwner; // 제목/내용/분류 수정은 작성자 본인만

  // 생성 시 createdAt==updatedAt이므로 1초 넘게 차이 나면 "수정됨"으로 본다.
  const isEdited =
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
    1000;

  const [open, setOpen] = useState(false);
  const del = useDeletePost('FEEDBACK');
  const { data: comments, isLoading } = usePostComments(post.id, open);

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && <CategoryBadge category={post.category} />}
            <h3 className="font-medium break-words">{post.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="text-foreground">{post.author.name ?? '익명'}</span>
            <span>{formatRelativeFromKstIso(post.createdAt)}</span>
            {isEdited && (
              <span className="text-muted-foreground/80">
                · 수정됨 {formatRelativeFromKstIso(post.updatedAt)}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm break-words whitespace-pre-wrap text-foreground/90">
          {post.content}
        </p>

        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex flex-wrap items-center gap-1">
            {board.enableLike && (
              <LikeButton
                type="FEEDBACK"
                postId={post.id}
                likeCount={post.likeCount}
                likedByMe={post.likedByMe}
              />
            )}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <MessageSquare className="size-3.5" />
                댓글 {post.commentCount}
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform',
                    open && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {(canEditText || isAdmin) && (
              <div className="ml-auto flex items-center gap-1">
                {canEditText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => onEdit(post)}
                  >
                    수정
                  </Button>
                )}
                <ConfirmDialog
                  title="글을 삭제할까요?"
                  description="삭제하면 이 글과 모든 댓글·공감이 사라집니다."
                  onConfirm={() => del.mutate(post.id)}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground"
                    >
                      삭제
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="mt-3 border-t border-border pt-3">
              <CommentThread
                postId={post.id}
                nodes={comments ?? []}
                maxDepth={board.commentMaxDepth}
                isLoading={isLoading}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </li>
  );
}
