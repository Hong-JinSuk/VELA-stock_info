import { IconDashboard } from '@tabler/icons-react';
import { Sparkles, UserCircle } from 'lucide-react';
import { NavItemProps } from '../types';

export const navMain: NavItemProps[] = [
  {
    title: 'Overview',
    url: '/overview',
    icon: IconDashboard,
  },
  {
    title: 'AI Analytics',
    url: '/ai/stocks',
    icon: Sparkles,
    isActive: true,
    items: [
      { title: 'Predict', url: '/predict' },
      { title: 'Compare', url: '/compare', disabled: true },
    ],
  },
];

export const navPresonal: NavItemProps[] = [
  {
    title: 'My',
    url: '/my',
    icon: UserCircle,
    isActive: true,
    items: [
      { title: 'AI Logs', url: '/ai-logs', disabled: true },
      {
        title: 'Setting',
        url: '/setting',
        disabled: true,
      },
    ],
  },
];
