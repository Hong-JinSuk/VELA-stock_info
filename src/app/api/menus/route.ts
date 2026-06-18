import { getMenuTree } from '@/lib/menu/get-menu-tree';
import { NextResponse } from 'next/server';

// GET /api/menus — 사이드바 메뉴 트리(hidden 플래그 포함). 네비 노출 필터는 클라에서.
// 민감정보가 아니므로 별도 게이팅 없이 현재 메뉴 구성만 반환.
export async function GET() {
  const tree = await getMenuTree();
  return NextResponse.json(tree);
}
