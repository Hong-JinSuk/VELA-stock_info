'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatRelativeFromKstIso } from '@/lib/kst';
import { useReviewComments } from '@/lib/services/community/use-review-comments';
import { useDeleteReview } from '@/lib/services/community/use-reviews';
import { cn } from '@/lib/utils';
import type { BoardSettings, ReviewItem } from '@/types/community';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import CommentThread from './comment-thread';
import ReviewForm from './review-form';

export default function ReviewCard({
  review,
  board,
}: {
  review: ReviewItem;
  board: BoardSettings;
}) {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const isAdmin = (session?.user?.role ?? 'FREE') === 'ADMIN';
  const canManage = myId === review.author.id || isAdmin;
  const canRate =
    board.enableRating && (board.ratingWritePolicy === 'ALL' || isAdmin);

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const del = useDeleteReview();
  const { data: comments, isLoading } = useReviewComments(review.id, open);

  if (editing) {
    return (
      <li className="rounded-xl border border-border p-4">
        <ReviewForm
          mode="edit"
          initial={review}
          canRate={canRate}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium break-words">{review.title}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="text-foreground">
                {review.author.name ?? '익명'}
              </span>
              <span>{formatRelativeFromKstIso(review.createdAt)}</span>
            </div>
          </div>
          {review.rating != null && (
            <StarRating value={review.rating} size="sm" />
          )}
        </div>

        <p className="text-sm break-words whitespace-pre-wrap text-foreground/90">
          {review.content}
        </p>

        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex flex-wrap items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <MessageSquare className="size-3.5" />
                댓글 {review.commentCount}
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform',
                    open && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {canManage && (
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setEditing(true)}
                >
                  수정
                </Button>
                <ConfirmDialog
                  title="후기를 삭제할까요?"
                  description="삭제하면 이 후기와 모든 댓글이 사라집니다."
                  onConfirm={() => del.mutate(review.id)}
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
                postId={review.id}
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
