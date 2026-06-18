import type { AccessLevel } from './user';

// FOLDER=아코디언(하위 보유) · LINK=단일 링크 · POPUP=새 창(오른쪽 끝 팝업 표시)
export type MenuType = 'FOLDER' | 'LINK' | 'POPUP';

// 사이드바 메뉴 트리 노드 (공개/관리 공통). icon은 레지스트리 키 문자열.
export type MenuNode = {
  id: string;
  key: string;
  parentId: string | null;
  title: string;
  path: string;
  icon: string | null;
  badge: string | null;
  type: MenuType;
  disabled: boolean;
  minRole: AccessLevel;
  hidden: boolean;
  locked: boolean;
  sortOrder: number;
  children: MenuNode[];
};
