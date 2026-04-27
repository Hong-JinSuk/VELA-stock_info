import { Icon } from '@tabler/icons-react';
import { type LucideIcon } from 'lucide-react';

export type NavItemProps = {
  title: string;
  url: string;
  icon?: Icon | LucideIcon;
  badge?: string;
  items?: {
    title: string;
    url: string;
    icon?: Icon | LucideIcon;
    badge?: string;
  }[];
};
