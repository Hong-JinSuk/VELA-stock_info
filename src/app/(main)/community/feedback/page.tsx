'use client';

import { Button } from '@/components/ui/button';
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_CATEGORY_ORDER,
} from '@/constants/community';
import { useBoardSettings } from '@/lib/services/community/use-community-board';
import { usePosts } from '@/lib/services/community/use-community-posts';
import { cn } from '@/lib/utils';
import type { FeedbackCategory, PostItem } from '@/types/community';
import { Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type ReactNode, useState } from 'react';
import FeedbackCard from './components/feedback-card';
import FeedbackForm from './components/feedback-form';

const PAGE_SIZE = 20;

// 작성/수정 모드 상태. 이 값이 있으면 목록 대신 전체 화면 컴포저를 보여준다.
type Composer = { mode: 'create' } | { mode: 'edit'; post: PostItem };

export default function FeedbackPage() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const { data: board } = useBoardSettings('FEEDBACK');
  const [composer, setComposer] = useState<Composer | null>(null);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePosts('FEEDBACK', page, PAGE_SIZE, category);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectCategory = (c: FeedbackCategory | null) => {
    setCategory(c);
    setPage(1);
  };

  // 작성/수정 모드: 폼만 전체 화면으로 (목록·필터 숨김).
  if (composer) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-xl tracking-tight">
            {composer.mode === 'create' ? '건의사항 작성' : '건의사항 수정'}
          </h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setComposer(null)}
            className="gap-1.5"
          >
            <X className="size-4" />
            취소
          </Button>
        </header>
        <FeedbackForm
          mode={composer.mode}
          initial={composer.mode === 'edit' ? composer.post : undefined}
          onDone={() => setComposer(null)}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl tracking-tight">건의사항</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            개선 아이디어·버그·있으면 하는 기능을 남겨주세요. 공감이 많은 의견부터
            반영해요.
          </p>
        </div>
        {isLoggedIn && (
          <Button
            type="button"
            size="sm"
            onClick={() => setComposer({ mode: 'create' })}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            글쓰기
          </Button>
        )}
      </header>

      {!isLoggedIn && (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          로그인하면 건의사항을 남길 수 있어요.
        </p>
      )}

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={category === null}
          onClick={() => selectCategory(null)}
        >
          전체
        </FilterChip>
        {FEEDBACK_CATEGORY_ORDER.map((c) => (
          <FilterChip
            key={c}
            active={category === c}
            onClick={() => selectCategory(c)}
          >
            {FEEDBACK_CATEGORY_LABELS[c]}
          </FilterChip>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 건의사항이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {board &&
            items.map((post) => (
              <FeedbackCard
                key={post.id}
                post={post}
                board={board}
                onEdit={(p) => setComposer({ mode: 'edit', post: p })}
              />
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-blue-500/50 bg-blue-500/10 text-foreground'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
