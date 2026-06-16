import { IconDashboard } from '@tabler/icons-react';
import { CandlestickChart, Sparkles, UserCircle } from 'lucide-react';
import { NavItemProps } from '../types';

export const navMain: NavItemProps[] = [
  {
    title: '대시보드',
    url: '/overview',
    icon: IconDashboard,
  },
  {
    title: '시장 데이터',
    url: '/market',
    icon: CandlestickChart,
    isActive: false,
    items: [
      { title: '경제 지표', url: '/indicators', disabled: false },
      { title: '섹터 지표', url: '/sectors', disabled: false },
      { title: '13F', url: '/13f', disabled: false },
      { title: '종목찾기', url: '/stocks', disabled: false },
    ],
  },
  {
    title: 'AI 분석',
    url: '/ai/stocks',
    icon: Sparkles,
    isActive: false,
    items: [
      { title: '주가 예측', url: '/predict' },
      { title: '적정 주가 평가', url: '/valuation', disabled: true },
      { title: '종목 비교', url: '/compare', disabled: true },
    ],
  },
  {
    title: '마이페이지',
    url: '/my',
    icon: UserCircle,
    isActive: false,
    items: [
      { title: '즐겨찾기', url: '/favorites' },
      { title: '보고서', url: '/report' },
      { title: 'AI 분석 기록', url: '/ai-logs', disabled: true },
      {
        title: '환경 설정',
        url: '/setting',
        disabled: true,
      },
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
      { title: '즐겨찾기', url: '/favorites' },
      { title: '보고서', url: '/report' },
      { title: 'AI 분석 기록', url: '/ai-logs', disabled: true },
      {
        title: '환경 설정',
        url: '/setting',
        disabled: true,
      },
    ],
  },
];
