'use client';

import { formatRelativeFromKstIso } from '@/lib/kst';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '@/lib/services/notification/use-notifications';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types/notification';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading } = useNotifications(50);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.read);

  const onItemClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.linkPath) router.push(n.linkPath);
  };

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto no-scrollbar p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl tracking-tight">알림</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            즐겨찾기한 종목·13F의 변동을 모아 보여줍니다.
          </p>
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            모두 읽음
          </button>
        )}
      </header>

      {isLoading ? (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          불러오는 중…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 알림이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onItemClick(n)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/40',
                  !n.read && 'bg-accent/20',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    n.read ? 'bg-transparent' : 'bg-rose-500',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {formatRelativeFromKstIso(n.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground break-keep">
                    {n.body}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
