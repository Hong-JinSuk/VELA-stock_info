import { IconDashboard } from '@tabler/icons-react';
import { Sparkles, UserCircle } from 'lucide-react';
import { NavItemProps } from '../types';

export const navMain: NavItemProps[] = [
  {
    title: '대시보드',
    url: '/overview',
    icon: IconDashboard,
  },
  {
    title: 'AI 분석',
    url: '/ai/stocks',
    icon: Sparkles,
    isActive: true,
    items: [
      { title: '주가 예측', url: '/predict' },
      { title: '적정 주가 평가', url: '/valuation', disabled: true },
      { title: '종목 비교', url: '/compare', disabled: true },
    ],
  },
];

export const navPresonal: NavItemProps[] = [
  {
    title: '마이페이지',
    url: '/my',
    icon: UserCircle,
    isActive: true,
    items: [
      { title: 'AI 분석 기록', url: '/ai-logs', disabled: true },
      {
        title: '환경 설정',
        url: '/setting',
        disabled: true,
      },
    ],
  },
];
