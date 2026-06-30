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
import {
  useDeleteReview,
  useUpdateReview,
} from '@/lib/services/community/use-reviews';
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
  const isOwner = myId === review.author.id;
  // 제목/내용 수정은 작성자 본인만. ADMIN은 별점 매기기 + 삭제만(남의 글 내용은 못 고침).
  const canEditText = isOwner;
  // 본인 편집 폼에서 별점 입력 노출 여부(본인이 별점 매길 수 있는 경우).
  const canRate =
    board.enableRating && (board.ratingWritePolicy === 'ALL' || isAdmin);
  // ADMIN이 남의 후기에 헤더 별점을 인라인으로 매기는 경우(본인 글은 폼에서 처리).
  const adminCanRate = isAdmin && !isOwner && board.enableRating;

  // 생성 시 createdAt==updatedAt이므로 1초 넘게 차이 나면 "수정됨"으로 본다.
  const isEdited =
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() >
    1000;

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const del = useDeleteReview();
  const update = useUpdateReview();
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
              {isEdited && (
                <span className="text-muted-foreground/80">
                  · 수정됨 {formatRelativeFromKstIso(review.updatedAt)}
                </span>
              )}
            </div>
          </div>
          {adminCanRate ? (
            <StarRating
              value={review.rating}
              onChange={(v) => update.mutate({ id: review.id, rating: v })}
              size="sm"
            />
          ) : (
            review.rating != null && <StarRating value={review.rating} size="sm" />
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

            {(canEditText || isAdmin) && (
              <div className="ml-auto flex items-center gap-1">
                {canEditText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditing(true)}
                  >
                    수정
                  </Button>
                )}
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
