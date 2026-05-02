'use client';

import { IconDashboard } from '@tabler/icons-react';
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
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { NavDocuments } from './nav-documents';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    // avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Overview',
      url: '/overview',
      icon: IconDashboard,
    },
    {
      title: 'AI-Analytics',
      url: '/ai/stocks',
      icon: Sparkles,
      isActive: true,
      items: [
        {
          title: 'Predict',
          url: '/predict',
        },
        {
          title: 'Compare',
          url: '/compare',
          disabled: true,
        },
      ],
    },
  ],
  navClouds: [
    // {
    //   title: 'Capture',
    //   icon: IconCamera,
    //   isActive: true,
    //   url: '#',
    //   items: [
    //     {
    //       title: 'Active Proposals',
    //       url: '#',
    //     },
    //     {
    //       title: 'Archived',
    //       url: '#',
    //     },
    //   ],
    // },
    // {
    //   title: 'Proposal',
    //   icon: IconFileDescription,
    //   url: '#',
    //   items: [
    //     {
    //       title: 'Active Proposals',
    //       url: '#',
    //     },
    //     {
    //       title: 'Archived',
    //       url: '#',
    //     },
    //   ],
    // },
    // {
    //   title: 'Prompts',
    //   icon: IconFileAi,
    //   url: '#',
    //   items: [
    //     {
    //       title: 'Active Proposals',
    //       url: '#',
    //     },
    //     {
    //       title: 'Archived',
    //       url: '#',
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    // {
    //   title: 'Settings',
    //   url: '#',
    //   icon: IconSettings,
    // },
    // {
    //   title: 'Get Help',
    //   url: '#',
    //   icon: IconHelp,
    // },
    // {
    //   title: 'Search',
    //   url: '#',
    //   icon: IconSearch,
    // },
  ],
  documents: [
    // {
    //   name: 'Data Library',
    //   url: '#',
    //   icon: IconDatabase,
    // },
    // {
    //   name: 'Reports',
    //   url: '#',
    //   icon: IconReport,
    // },
    // {
    //   name: 'Word Assistant',
    //   url: '#',
    //   icon: IconFileWord,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        {data.navMain.length > 0 && <NavMain items={data.navMain} />}
        {data.documents.length > 0 && <NavDocuments items={data.documents} />}
        {data.navSecondary.length > 0 && (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
