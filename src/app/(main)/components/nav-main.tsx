'use client';

import { IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItemProps } from '../types';

const activeColor =
  'bg-blue-600/10 text-blue-500 font-medium border border-blue-500/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:text-blue-500 dark:hover:text-blue-500';
const nonActiveColor =
  'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent';

export function NavMain({ items }: { items: NavItemProps[] }) {
  const pathname = usePathname();
  const lastSegment = pathname.split('/').filter(Boolean).pop();
  const [selectedMenu, setSelectedMenu] = useState<string>(lastSegment ?? '');

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-y-1.5">
          {items.map((item) => {
            if (item.items && item.items.length > 0) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`w-full py-4 px-3 rounded-xl transition-all cursor-pointer dark:text-white dark:hover:text-white ${nonActiveColor}`}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              onClick={() => setSelectedMenu(subItem.title)}
                              className={`rounded-lg transition-all ${
                                selectedMenu.toLocaleLowerCase() ===
                                subItem.title.toLocaleLowerCase()
                                  ? activeColor
                                  : nonActiveColor
                              }`}
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  onClick={() => setSelectedMenu(item.title)}
                  className={`w-full flex items-center lg:justify-start py-4 px-3 rounded-xl transition-all dark:text-white dark:hover:text-white ${
                    selectedMenu.toLocaleLowerCase() ===
                    item.title.toLocaleLowerCase()
                      ? activeColor
                      : nonActiveColor
                  } group relative`}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="hidden lg:flex items-center justify-center px-1.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold ml-auto leading-none h-5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
