'use client';

import { ThemeToggleButton } from '@/components/common/theme-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { agentStatusAtom } from '@/store/ai-atom';
import { AgentStatus } from '@/types/ai';
import { UserRole } from '@/types/user';
import { useAtom } from 'jotai';
import { useMenus } from '@/lib/services/menu/use-menus';
import type { MenuNode } from '@/types/menu';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ACTIVE_STATUSES = ['분석 중'] as const;

export function MainHeader() {
  const [agentStatus, setAgentStatus] = useAtom(agentStatusAtom);
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { data: menus } = useMenus();
  const breadcrumbs = getBreadcrumbs(pathname, menus ?? []);
  const agentStatusRef = useRef(agentStatus);

  useEffect(() => {
    agentStatusRef.current = agentStatus;
  });

  const sessionUser = session?.user ?? null;
  const usage = sessionUser?.usage ?? null;
  const role = sessionUser?.role as UserRole | undefined;
  const isUnlimited = usage?.maxLimit === -1;
  const remaining =
    usage && !isUnlimited
      ? Math.max(0, usage.maxLimit - usage.usedCount)
      : null;
  const policyDesc = getPolicyDescription(
    role,
    usage?.cycleEnd ? new Date(usage.cycleEnd) : undefined,
  );

  useEffect(() => {
    if ((ACTIVE_STATUSES as readonly AgentStatus[]).includes(agentStatusRef.current)) return;

    if (!session) {
      setAgentStatus('로그인 필요');
      return;
    }
    if (usage && usage.maxLimit !== -1 && usage.usedCount >= usage.maxLimit) {
      setAgentStatus('사용 만료');
      return;
    }
    setAgentStatus('사용 가능');
  }, [session, usage, setAgentStatus]);
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 size-4 sm:size-7" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <nav className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-sm font-medium">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span
                className={
                  i < breadcrumbs.length - 1 ? 'text-muted-foreground' : ''
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border">
            <div className="relative flex h-2 w-2 shrink-0">
              {agentStatus === '분석 중' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  agentStatus === '분석 중'
                    ? 'bg-yellow-500'
                    : agentStatus === '분석 완료'
                      ? 'bg-blue-500'
                      : agentStatus === '사용 만료'
                        ? 'bg-red-500'
                        : 'bg-primary',
                )}
              ></span>
            </div>
            <span className="text-xs font-mono font-bold transition-colors overflow-hidden inline-flex items-center gap-1 align-middle mt-0.5">
              <span className="text-[10px] sm:text-xs">AI AGENT: </span>
              <span
                className={cn(
                  agentStatus === '분석 중'
                    ? 'text-yellow-500 animate-dots'
                    : agentStatus === '분석 오류'
                      ? 'text-yellow-700'
                      : agentStatus === '분석 완료'
                        ? 'text-blue-500'
                        : agentStatus === '사용 만료'
                          ? 'text-red-500'
                          : 'text-primary',
                  'text-[10px] sm:text-xs',
                )}
              >
                {agentStatus}
              </span>
              {agentStatus === '사용 가능' && isMobile ? (
                <>
                  <span className="text-muted-foreground">
                    {isUnlimited
                      ? '(∞)'
                      : remaining
                        ? `(${remaining}회 남음)`
                        : `(사용불가)`}
                  </span>
                  {policyDesc && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground text-[9px] font-bold cursor-default shrink-0">
                          ?
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        className="w-auto p-2 px-3 text-sm"
                      >
                        <p>{policyDesc}</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {isUnlimited
                      ? '(∞)'
                      : remaining
                        ? `(${remaining}회 남음)`
                        : `(사용불가)`}
                  </span>
                  {policyDesc && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-muted-foreground text-[9px] font-bold cursor-default shrink-0">
                          ?
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{policyDesc}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
            </span>
          </div>
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}

function getPolicyDescription(
  role: UserRole | undefined,
  cycleEnd: Date | undefined,
): string {
  switch (role) {
    case 'FREE': {
      const d = cycleEnd ? new Date(cycleEnd) : null;
      const reset = d ? `${d.getMonth() + 1}/${d.getDate()}` : null;
      return `매주 2회 사용 가능${reset ? ` · 다음 초기화 ${reset}` : ''}`;
    }
    case 'BASIC':
      return '매달 20회 사용 가능 · 매달 자동 초기화';
    case 'PRO':
      return '매달 50회 사용 가능 · 매달 자동 초기화';
    case 'MAX': {
      const d = cycleEnd ? new Date(cycleEnd) : null;
      const reset = d
        ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        : null;
      return `시간당 10회 사용 가능${reset ? ` · 다음 초기화 ${reset}` : ''}`;
    }
    case 'ADMIN':
    case 'TESTER':
      return '무제한 사용 가능';
    default:
      return '';
  }
}

// DB 메뉴 트리에서 현재 경로의 브레드크럼(대분류 → 하위)을 찾는다. path는 풀 경로.
function getBreadcrumbs(pathname: string, tree: MenuNode[]): string[] {
  for (const group of tree) {
    for (const sub of group.children) {
      if (pathname === sub.path || pathname.startsWith(`${sub.path}/`)) {
        return [group.title, sub.title];
      }
    }
    if (pathname === group.path || pathname.startsWith(`${group.path}/`)) {
      return [group.title];
    }
  }
  return [];
}
