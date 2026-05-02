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
  disabled?: boolean; // 추가
  items?: {
    title: string;
    url: string;
    disabled?: boolean; // 추가
  }[];
};
