'use client';

import { Button } from '@/components/ui/button';
import { useBoardSettings } from '@/lib/services/community/use-board-settings';
import { useMyReview, useReviews } from '@/lib/services/community/use-reviews';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ReviewCard from './components/review-card';
import ReviewForm from './components/review-form';

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = (session?.user?.role ?? 'FREE') === 'ADMIN';

  const { data: board } = useBoardSettings();
  const { data: myReview } = useMyReview(isLoggedIn);

  const [page, setPage] = useState(1);
  const { data, isLoading } = useReviews(page, PAGE_SIZE);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const canRateOnCreate =
    Boolean(board?.enableRating) &&
    (board?.ratingWritePolicy === 'ALL' || isAdmin);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">사용 후기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          VELA를 사용해 본 소감을 남겨주세요.
        </p>
      </header>

      {/* 작성 영역: 1인 1후기 — 내 후기가 없을 때만 작성 폼 노출 */}
      {isLoggedIn ? (
        board && !myReview ? (
          <section className="rounded-xl border border-border p-4">
            <ReviewForm mode="create" canRate={canRateOnCreate} />
          </section>
        ) : myReview ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            이미 후기를 작성했어요. 아래 목록에서 수정하거나 삭제할 수 있어요.
          </p>
        ) : null
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          로그인하면 후기를 남길 수 있어요.
        </p>
      )}

      {/* 목록 */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 후기가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {board &&
            items.map((review) => (
              <ReviewCard key={review.id} review={review} board={board} />
            ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </Button>
        </div>
      )}
    </main>
  );
}
