'use client';

import {
  Calculator,
  ListChecks,
  MessagesSquare,
  Settings2,
  ShieldCheck,
  Star,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 관리 영역 상단 고정 탭 — 스크롤 영역(페이지 <main>) 바깥(admin 레이아웃)에 두어
// 콘텐츠와 겹치지 않고 항상 같은 자리에 노출된다.
const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: '관리 홈', icon: Settings2 },
  { href: '/admin/menus', label: '메뉴 관리', icon: ShieldCheck },
  { href: '/admin/sectors', label: '섹터 분석 관리', icon: ListChecks },
  { href: '/admin/key-indicators', label: '중요 지표 관리', icon: Star },
  { href: '/admin/valuation', label: '적정주가 조정', icon: Calculator },
  { href: '/admin/community', label: '커뮤니티 관리', icon: MessagesSquare },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-center gap-2 overflow-x-auto no-scrollbar border-b border-border px-6 py-3">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/30 dark:text-blue-400'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
