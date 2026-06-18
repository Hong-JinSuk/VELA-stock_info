'use client';

import * as React from 'react';

import { VelaLogo } from '@/components/common/vela-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavMenus } from '@/lib/services/menu/use-nav-menus';
import Link from 'next/link';
import { NavAdmin } from './nav-admin';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { items: visibleNav, isLoading } = useNavMenus();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/overview">
                <VelaLogo className="size-7!" />
                <span className="text-base font-semibold tracking-widest">
                  VELA
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="flex flex-col gap-1.5 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : (
          visibleNav.length > 0 && <NavMain items={visibleNav} />
        )}
        {/* {navPresonal.length > 0 && <NavPersonal items={navPresonal} />} */}
        <NavAdmin />
        {/* {data.documents.length > 0 && <NavDocuments items={data.documents} />}
        {data.navSecondary.length > 0 && (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        )} */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
