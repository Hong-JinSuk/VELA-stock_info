'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useIndicatorBatchMutation } from '@/lib/services/admin/use-indicator-batch-mutation';
import { useOverviewSnapshotMutation } from '@/lib/services/admin/use-overview-snapshot-mutation';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

// ADMIN 권한 유저에게만 노출되는 사이드바 섹션. 오버뷰 인사이트 / 지표 수동 배치 트리거 제공.
export function NavAdmin() {
  const { data: session } = useSession();
  const overviewMutation = useOverviewSnapshotMutation();
  const indicatorMutation = useIndicatorBatchMutation();

  if (session?.user?.role !== 'ADMIN') return null;

  const isOverviewPending = overviewMutation.isPending;
  const isIndicatorPending = indicatorMutation.isPending;

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-y-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="오버뷰 인사이트 수동 배치"
              disabled={isOverviewPending}
              onClick={() => overviewMutation.mutate()}
              className="w-full flex items-center py-4 px-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent dark:text-white dark:hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isOverviewPending ? (
                <IconLoader2 className="animate-spin" />
              ) : (
                <IconRefresh />
              )}
              <span>
                {isOverviewPending ? '오버뷰 배치 실행 중...' : '오버뷰 수동 배치'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="FRED + Yahoo 지표 수동 배치"
              disabled={isIndicatorPending}
              onClick={() => indicatorMutation.mutate()}
              className="w-full flex items-center py-4 px-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent dark:text-white dark:hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isIndicatorPending ? (
                <IconLoader2 className="animate-spin" />
              ) : (
                <IconRefresh />
              )}
              <span>
                {isIndicatorPending ? '지표 배치 실행 중...' : '지표 수동 배치'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
