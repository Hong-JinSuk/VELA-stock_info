import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

// 데모를 감싸는 브라우저 창(chrome). 신호등 버튼 + 주소창 + 본문.
export default function BrowserFrame({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* 타이틀바 */}
      <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-3 py-2.5">
        <div className="flex shrink-0 gap-1.5">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">{path}</span>
        </div>
      </div>
      {/* 본문 */}
      <div className="bg-background p-4 sm:p-5">{children}</div>
    </div>
  );
}
