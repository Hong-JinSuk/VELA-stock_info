'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatRelativeFromKstIso } from '@/lib/kst';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/lib/services/notification/use-notifications';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types/notification';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications(10);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];

  const onItemClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.linkPath) router.push(n.linkPath);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="알림"
          className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold">알림</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              모두 읽음
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              불러오는 중…
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              새 알림이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={cn(
                      'flex w-full items-start gap-2 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/40',
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
                        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                          {formatRelativeFromKstIso(n.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground break-keep">
                        {n.body}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-center">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/my/notifications');
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            전체 보기
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
