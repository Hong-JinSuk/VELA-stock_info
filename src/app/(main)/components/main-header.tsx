'use client';

import { ThemeToggleButton } from '@/components/common/theme-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/user';
import { agentStatusAtom } from '@/store/ai-atom';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

function getPolicyDescription(role: UserRole | undefined, cycleEnd: Date | undefined): string {
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

const ACTIVE_STATUSES = ['분석 중'] as const;

export function MainHeader() {
  const [agentStatus, setAgentStatus] = useAtom(agentStatusAtom);
  const { data: session } = useSession();
  const agentStatusRef = useRef(agentStatus);

  useEffect(() => {
    agentStatusRef.current = agentStatus;
  });

  const sessionUser = (session?.user as any) ?? null;
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
    if (ACTIVE_STATUSES.includes(agentStatusRef.current as any)) return;

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
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/Hong-JinSuk/VELA-stock_info"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              Stock Info
            </a>
          </Button>
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
              <span className="text-foreground">AI AGENT: </span>
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
                )}
              >
                {agentStatus}
              </span>
              {agentStatus === '사용 가능' && (
                <>
                  <span className="text-muted-foreground">
                    {isUnlimited ? '(∞)' : `(${remaining}회 남음)`}
                  </span>
                  {policyDesc && (
                    <TooltipProvider>
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
                    </TooltipProvider>
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
