import { IconDashboard, type Icon } from '@tabler/icons-react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CandlestickChart,
  FileText,
  Globe,
  LayoutGrid,
  LineChart,
  type LucideIcon,
  ListChecks,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCircle,
  Wallet,
} from 'lucide-react';

export type MenuIconComponent = Icon | LucideIcon;

// 메뉴 아이콘 레지스트리. DB에는 키 문자열(icon)만 저장하고, 클라에서 이 맵으로 컴포넌트를 해석한다.
// 관리 화면 아이콘 드롭다운도 이 맵의 키 목록을 사용한다.
export const MENU_ICON_MAP: Record<string, MenuIconComponent> = {
  dashboard: IconDashboard,
  market: CandlestickChart,
  analysis: LineChart,
  ai: Sparkles,
  my: UserCircle,
  chart: BarChart3,
  trending: TrendingUp,
  star: Star,
  building: Building2,
  grid: LayoutGrid,
  file: FileText,
  bell: Bell,
  settings: Settings2,
  shield: ShieldCheck,
  list: ListChecks,
  globe: Globe,
  wallet: Wallet,
  search: Search,
  book: BookOpen,
};

// 관리 화면 드롭다운 옵션(등록 순서 유지).
export const MENU_ICON_OPTIONS: string[] = Object.keys(MENU_ICON_MAP);

// 기본 fallback 아이콘 — 알 수 없는 키이거나 미지정일 때.
export const FALLBACK_MENU_ICON: MenuIconComponent = LayoutGrid;

// 아이콘 키 → 컴포넌트. 없으면 fallback.
export function resolveMenuIcon(icon?: string | null): MenuIconComponent {
  if (!icon) return FALLBACK_MENU_ICON;
  return MENU_ICON_MAP[icon] ?? FALLBACK_MENU_ICON;
}
