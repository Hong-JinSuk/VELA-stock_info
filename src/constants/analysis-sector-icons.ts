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

// 테마 섹터명 → 어울리는 아이콘. 분석 섹터엔 icon 필드가 없어 이름/슬러그 키워드로 해석한다
// (sectorColor·SECTOR_KO 같은 UI 표현 맵). 매칭 없으면 기본 Layers.
// ⚠️ 순서 중요: 위에서부터 첫 매칭을 사용하므로 더 구체적인 규칙을 먼저 둔다
//   (예: '사이버보안'이 'AI' 규칙보다, '양자컴퓨팅'이 '반도체' 규칙보다 앞서야 의도대로 잡힌다).
const SECTOR_ICON_RULES: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /우주|항공우주|space|aerospace|위성|satellite/i, icon: Rocket },
  { test: /양자|quantum/i, icon: Atom },
  { test: /사이버|보안|security|cyber/i, icon: ShieldCheck },
  { test: /방산|국방|무기|defense|military/i, icon: Shield },
  { test: /인공지능|머신러닝|딥러닝|\bAI\b|\bLLM\b/i, icon: BrainCircuit },
  { test: /반도체|칩|semiconductor|chip/i, icon: Cpu },
  { test: /로봇|robot|자동화|automation/i, icon: Bot },
  { test: /전기차|자율주행|모빌리티|자동차|\bEV\b|mobility/i, icon: Car },
  {
    test: /인프라|에너지|전력|원자력|그리드|power|energy|infra|grid|nuclear/i,
    icon: Zap,
  },
  {
    test: /신재생|친환경|태양광|풍력|클린|renewable|solar|wind|green|clean/i,
    icon: Leaf,
  },
  {
    test: /바이오|헬스|제약|의료|건강|bio|health|pharma|medical/i,
    icon: HeartPulse,
  },
  { test: /금융|핀테크|은행|증권|보험|fintech|finance|bank/i, icon: Landmark },
  {
    test: /클라우드|데이터|빅데이터|소프트웨어|cloud|data|software|saas/i,
    icon: Cloud,
  },
];

export const FALLBACK_SECTOR_ICON: LucideIcon = Layers;

// 섹터 이름(+슬러그)으로 어울리는 아이콘을 해석. 매칭 없으면 Layers.
export function analysisSectorIcon(
  name: string,
  slug?: string | null,
): LucideIcon {
  const hay = `${name} ${slug ?? ''}`;
  for (const { test, icon } of SECTOR_ICON_RULES) {
    if (test.test(hay)) return icon;
  }
  return FALLBACK_SECTOR_ICON;
}
