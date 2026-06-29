'use client';

import type { RatingWritePolicy } from '@/generated/prisma/client';
import {
  useBoardSettings,
  useUpdateBoardSettings,
} from '@/lib/services/community/use-board-settings';

const SELECT_CLASS =
  'h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-blue-500/50';

export default function AdminCommunityPage() {
  const { data: board, isLoading } = useBoardSettings();
  const update = useUpdateBoardSettings();

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">커뮤니티 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사용 후기 게시판 설정을 변경합니다.
        </p>
      </header>

      {isLoading || !board ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <div className="flex max-w-md flex-col gap-5 rounded-xl border border-border p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">별점 작성 권한</span>
            <p className="text-xs text-muted-foreground">
              사용 후기에 별점을 남길 수 있는 대상을 정합니다.
            </p>
            <select
              value={board.ratingWritePolicy}
              disabled={update.isPending}
              onChange={(e) =>
                update.mutate({
                  ratingWritePolicy: e.target.value as RatingWritePolicy,
                })
              }
              className={SELECT_CLASS}
            >
              <option value="ALL">모두 (로그인 사용자)</option>
              <option value="ADMIN">관리자만</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">댓글 깊이</span>
            <p className="text-xs text-muted-foreground">
              댓글에 답글을 몇 단계까지 허용할지 정합니다.
            </p>
            <select
              value={String(board.commentMaxDepth)}
              disabled={update.isPending}
              onChange={(e) =>
                update.mutate({ commentMaxDepth: Number(e.target.value) })
              }
              className={SELECT_CLASS}
            >
              <option value="1">1단계 (댓글만)</option>
              <option value="2">2단계 (댓글 + 대댓글)</option>
              <option value="3">3단계 (대대댓글까지)</option>
            </select>
          </div>

          {update.isPending && (
            <p className="text-xs text-muted-foreground">저장 중…</p>
          )}
        </div>
      )}
    </main>
  );
}
