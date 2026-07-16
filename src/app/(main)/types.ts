import { Icon } from '@tabler/icons-react';
import { type LucideIcon } from 'lucide-react';

// export type NavItemProps = {
//   title: string;
//   url: string;
//   icon?: Icon | LucideIcon;
//   badge?: string;
//   items?: {
//     title: string;
//     url: string;
//     icon?: Icon | LucideIcon;
//     badge?: string;
//   }[];
// };

export type NavItemProps = {
  title: string;
  url: string;
  icon?: Icon | LucideIcon;
  isActive?: boolean;
  badge?: string;
  beta?: boolean; // Beta 서비스 배지
  disabled?: boolean; // 추가
  popup?: boolean; // POPUP 타입: 새 창으로 열고 오른쪽 끝에 팝업 아이콘 표시
  routeKey?: string; // 접근권한 키 (Menu.key). 없으면 항상 노출.
  items?: {
    title: string;
    url: string;
    disabled?: boolean; // 추가
    beta?: boolean; // Beta 서비스 배지
    popup?: boolean; // POPUP 타입
    routeKey?: string; // 접근권한 키
  }[];
};
