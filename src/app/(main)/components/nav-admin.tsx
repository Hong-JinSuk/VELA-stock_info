'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Settings2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ADMIN 권한 유저에게만 노출되는 사이드바 섹션.
// 세부 관리 도구(메뉴 권한/섹터/수동 배치)는 /admin 페이지로 모음 — 사이드바는 단일 진입점만.
export function NavAdmin() {
  const { data: session } = useSession();
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-y-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="관리"
              className="w-full flex items-center py-4 px-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent dark:text-white dark:hover:text-white cursor-pointer"
            >
              <Link href="/admin">
                <Settings2 />
                <span>관리</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
