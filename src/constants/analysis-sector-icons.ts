import {
  Atom,
  Bot,
  BrainCircuit,
  Car,
  Cloud,
  Cpu,
  HeartPulse,
  Landmark,
  Layers,
  Leaf,
  type LucideIcon,
  Rocket,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// 테마 섹터명 → 어울리는 아이콘 + 은은한 테마색. 분석 섹터엔 icon 필드가 없어 이름/슬러그
// 키워드로 해석한다(sectorColor·SECTOR_KO 같은 UI 표현 맵). 매칭 없으면 기본(Layers·muted).
// ⚠️ 순서 중요: 위에서부터 첫 매칭을 사용하므로 더 구체적인 규칙을 먼저 둔다
//   (예: '사이버보안'이 'AI'보다, '양자컴퓨팅'이 '반도체'보다 앞서야 의도대로 잡힌다).
// badge: 배지 배경(틴트)+아이콘 색. 라이트/다크 공통으로 보이는 -500 톤 위주. Tailwind가
//   정적 스캔할 수 있게 반드시 완전한 클래스 문자열로 둔다(문자열 조합 금지).
export type SectorTheme = { Icon: LucideIcon; badge: string };

const SECTOR_RULES: Array<{ test: RegExp; Icon: LucideIcon; badge: string }> = [
  {
    test: /우주|항공우주|space|aerospace|위성|satellite/i,
    Icon: Rocket,
    badge: 'bg-indigo-500/10 text-indigo-500',
  },
  {
    test: /양자|quantum/i,
    Icon: Atom,
    badge: 'bg-violet-500/10 text-violet-500',
  },
  {
    test: /사이버|보안|security|cyber/i,
    Icon: ShieldCheck,
    badge: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    test: /방산|국방|무기|defense|military/i,
    Icon: Shield,
    badge: 'bg-red-500/10 text-red-500',
  },
  {
    test: /인공지능|머신러닝|딥러닝|\bAI\b|\bLLM\b/i,
    Icon: BrainCircuit,
    badge: 'bg-sky-500/10 text-sky-500',
  },
  {
    test: /반도체|칩|semiconductor|chip/i,
    Icon: Cpu,
    badge: 'bg-blue-500/10 text-blue-500',
  },
  {
    test: /로봇|robot|자동화|automation/i,
    Icon: Bot,
    badge: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    test: /전기차|자율주행|모빌리티|자동차|\bEV\b|mobility/i,
    Icon: Car,
    badge: 'bg-teal-500/10 text-teal-500',
  },
  {
    test: /인프라|에너지|전력|원자력|그리드|power|energy|infra|grid|nuclear/i,
    Icon: Zap,
    badge: 'bg-amber-500/10 text-amber-500',
  },
  {
    test: /신재생|친환경|태양광|풍력|클린|renewable|solar|wind|green|clean/i,
    Icon: Leaf,
    badge: 'bg-green-500/10 text-green-500',
  },
  {
    test: /바이오|헬스|제약|의료|건강|bio|health|pharma|medical/i,
    Icon: HeartPulse,
    badge: 'bg-rose-500/10 text-rose-500',
  },
  {
    test: /금융|핀테크|은행|증권|보험|fintech|finance|bank/i,
    Icon: Landmark,
    badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  {
    test: /클라우드|데이터|빅데이터|소프트웨어|cloud|data|software|saas/i,
    Icon: Cloud,
    badge: 'bg-slate-500/10 text-slate-500',
  },
];

export const FALLBACK_SECTOR_THEME: SectorTheme = {
  Icon: Layers,
  badge: 'bg-muted text-muted-foreground',
};

// 섹터 이름(+슬러그)으로 어울리는 아이콘·테마색을 해석. 매칭 없으면 기본(Layers·muted).
export function analysisSectorTheme(
  name: string,
  slug?: string | null,
): SectorTheme {
  const hay = `${name} ${slug ?? ''}`;
  for (const { test, Icon, badge } of SECTOR_RULES) {
    if (test.test(hay)) return { Icon, badge };
  }
  return FALLBACK_SECTOR_THEME;
}
