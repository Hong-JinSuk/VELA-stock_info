'use client';

import { IconChevronRight } from '@tabler/icons-react';
import { AppWindow } from 'lucide-react';

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
const disabledColor =
  'text-muted-foreground/40 opacity-50 cursor-not-allowed pointer-events-none border border-transparent';

const isMenuActive = (pathname: string, url: string) => {
  if (!url || url === '#') return false;
  return pathname === url || pathname.startsWith(`${url}/`);
};

// POPUP 타입 메뉴: 새 창(팝업)으로 연다. 내부 경로는 base path를 붙인다.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const openPopup = (url: string) => {
  if (!url || url === '#') return;
  const href = /^https?:\/\//.test(url) ? url : `${BASE_PATH}${url}`;
  window.open(href, '_blank', 'noopener,noreferrer,width=1100,height=800');
};

// 상위 경로(Level 1)와 하위 경로(Level 2)를 자동으로 합쳐주는 함수
const getFullUrl = (parentUrl: string, childUrl: string) => {
  if (!parentUrl || parentUrl === '#') return childUrl; // 부모가 경로가 없으면 자식 경로 그대로 사용
  if (childUrl.startsWith(parentUrl)) return childUrl; // 이미 전체 경로가 적혀있으면 그대로 통과

  const cleanParent = parentUrl.endsWith('/')
    ? parentUrl.slice(0, -1)
    : parentUrl;
  const cleanChild = childUrl.startsWith('/') ? childUrl : `/${childUrl}`;

  return `${cleanParent}${cleanChild}`; // 예: '/ai/stock' + '/predict' = '/ai/stock/predict'
};

export function NavMain({ items }: { items: NavItemProps[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-y-1.5">
          {items.map((item) => {
            const hasChildren = item.items && item.items.length > 0;

            if (hasChildren) {
              // 자식 메뉴 중 하나라도 현재 경로에 포함되어 있는지 확인 (결합된 URL 기준)
              const isChildActive = item.items!.some((subItem) => {
                const fullUrl = getFullUrl(item.url, subItem.url);
                return isMenuActive(pathname, fullUrl);
              });

              const triggerStyle = item.disabled
                ? disabledColor
                : isChildActive
                  ? 'text-blue-600 font-medium dark:text-blue-400'
                  : nonActiveColor;

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isChildActive || item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`w-full py-4 px-3 rounded-xl transition-all cursor-pointer dark:text-white dark:hover:text-white ${triggerStyle}`}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.disabled && (
                          <span className="ml-2 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                            준비 중
                          </span>
                        )}
                        {item.beta && <BetaTag className="ml-auto" />}
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub>
                        {item.items!.map((subItem) => {
                          // 상위 URL과 하위 URL 결합
                          const fullUrl = getFullUrl(item.url, subItem.url);
                          const isSubActive = isMenuActive(pathname, fullUrl);

                          const subStyle = subItem.disabled
                            ? disabledColor
                            : isSubActive
                              ? activeColor
                              : nonActiveColor;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`rounded-lg transition-all ${subStyle}`}
                              >
                                {subItem.disabled ? (
                                  <div className="flex items-center justify-between w-full">
                                    <span>{subItem.title}</span>
                                    <span className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-md leading-none">
                                      준비 중
                                    </span>
                                  </div>
                                ) : subItem.popup ? (
                                  <button
                                    type="button"
                                    onClick={() => openPopup(fullUrl)}
                                    className="flex w-full items-center justify-between"
                                  >
                                    <span>{subItem.title}</span>
                                    <AppWindow className="size-3.5 opacity-60" />
                                  </button>
                                ) : (
                                  <Link
                                    href={fullUrl}
                                    className="flex w-full items-center"
                                  >
                                    <span>{subItem.title}</span>
                                    {subItem.beta && (
                                      <BetaTag className="ml-auto" />
                                    )}
                                  </Link>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            // 하위 메뉴가 없는 경우
            const isMainActive = isMenuActive(pathname, item.url);
            const mainStyle = item.disabled
              ? disabledColor
              : isMainActive
                ? activeColor
                : nonActiveColor;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`w-full flex items-center lg:justify-start py-4 px-3 rounded-xl transition-all dark:text-white dark:hover:text-white ${mainStyle} group relative`}
                >
                  {item.disabled ? (
                    <div className="flex items-center w-full">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <span className="hidden lg:flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium ml-auto leading-none h-5">
                        준비 중
                      </span>
                    </div>
                  ) : item.popup ? (
                    <button
                      type="button"
                      onClick={() => openPopup(item.url)}
                      className="flex w-full items-center"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <AppWindow className="ml-auto size-4 opacity-60" />
                    </button>
                  ) : (
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="hidden lg:flex items-center justify-center px-1.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold ml-auto leading-none h-5">
                          {item.badge}
                        </span>
                      )}
                      {item.beta && <BetaTag className="ml-auto" />}
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Beta 서비스 배지 — Menu.beta=true인 항목에 표시.
function BetaTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-violet-600 dark:text-violet-400 ${className}`}
    >
      BETA
    </span>
  );
}
