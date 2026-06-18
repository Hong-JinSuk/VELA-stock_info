import prisma from '@/lib/prisma';

// 기본 메뉴 트리 — 빈 테이블일 때의 안전망 시드(초기 데이터는 마이그레이션 SQL이 채운다).
// 마이그레이션 시드와 동일한 구조를 유지할 것.
type SeedLeaf = {
  key: string;
  title: string;
  path: string;
  disabled?: boolean;
};
type SeedGroup = SeedLeaf & { icon?: string; children?: SeedLeaf[] };

export const DEFAULT_MENU_SEED: SeedGroup[] = [
  { key: 'dashboard', title: '대시보드', path: '/overview', icon: 'dashboard' },
  {
    key: 'group-market',
    title: '시장 데이터',
    path: '/market',
    icon: 'market',
    children: [
      { key: 'market-indicators', title: '경제 지표', path: '/market/indicators' },
      { key: 'market-sectors', title: '섹터 지표', path: '/market/sectors' },
      { key: 'market-13f', title: '13F', path: '/market/13f' },
      { key: 'market-stocks', title: '종목찾기', path: '/market/stocks' },
    ],
  },
  {
    key: 'group-analysis',
    title: '데이터 분석',
    path: '/analysis',
    icon: 'analysis',
    children: [
      { key: 'analysis-sectors', title: '섹터 분석', path: '/analysis/sectors' },
    ],
  },
  {
    key: 'group-ai',
    title: 'AI 분석',
    path: '/ai/stocks',
    icon: 'ai',
    children: [
      { key: 'ai-predict', title: '주가 예측', path: '/ai/stocks/predict' },
      {
        key: 'ai-valuation',
        title: '적정 주가 평가',
        path: '/ai/stocks/valuation',
        disabled: true,
      },
      {
        key: 'ai-compare',
        title: '종목 비교',
        path: '/ai/stocks/compare',
        disabled: true,
      },
    ],
  },
  {
    key: 'group-my',
    title: '마이페이지',
    path: '/my',
    icon: 'my',
    children: [
      { key: 'my-favorites', title: '즐겨찾기', path: '/my/favorites' },
      { key: 'my-13f-report', title: '13F 보고서', path: '/my/13f-report' },
      { key: 'my-stocks-report', title: '종목 보고서', path: '/my/stocks-report' },
      { key: 'my-ai-logs', title: 'AI 분석 기록', path: '/my/ai-logs', disabled: true },
      { key: 'my-setting', title: '환경 설정', path: '/my/setting', disabled: true },
    ],
  },
];

// 테이블이 비어 있을 때만 기본 트리를 삽입(멱등). 정상 환경에서는 마이그레이션 시드로 이미 채워져 skip된다.
export async function ensureMenusSeeded(): Promise<void> {
  const count = await prisma.menu.count();
  if (count > 0) return;

  for (let i = 0; i < DEFAULT_MENU_SEED.length; i++) {
    const group = DEFAULT_MENU_SEED[i];
    const children = group.children ?? [];
    const parent = await prisma.menu.create({
      data: {
        key: group.key,
        title: group.title,
        path: group.path,
        icon: group.icon ?? null,
        type: children.length > 0 ? 'FOLDER' : 'LINK',
        disabled: group.disabled ?? false,
        sortOrder: i,
      },
    });
    for (let j = 0; j < children.length; j++) {
      const child = children[j];
      await prisma.menu.create({
        data: {
          key: child.key,
          parentId: parent.id,
          title: child.title,
          path: child.path,
          type: 'LINK',
          disabled: child.disabled ?? false,
          sortOrder: j,
        },
      });
    }
  }
}
