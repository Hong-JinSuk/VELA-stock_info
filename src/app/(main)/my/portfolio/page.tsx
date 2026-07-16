'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { ASSET_CLASSES, type AssetClass } from '@/constants/asset-classes';
import { getTemplate } from '@/constants/portfolio-templates';
import { customTargetSum, diagnose } from '@/lib/portfolio/diagnose';
import {
  EMPTY_HOLDINGS,
  customTargetAtom,
  holdingsAtom,
  selectedTemplateAtom,
} from '@/store/portfolio-atom';
import { useAtom } from 'jotai';
import { RotateCcw, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import DiagnosisResult from './components/diagnosis-result';
import HoldingsInput from './components/holdings-input';
import TemplateSelector from './components/template-selector';

const EMPTY_TARGET = ASSET_CLASSES.reduce(
  (acc, c) => {
    acc[c] = 0;
    return acc;
  },
  {} as Record<AssetClass, number>,
);

// 마이페이지 — 포트폴리오 진단. 모델 포트폴리오(목표 배분)를 고르고 내 자산을 입력하면
// 자산군별 과부족·위험 성향·종목 집중을 진단한다. MVP: 서버 저장 없이 localStorage 보존.
export default function PortfolioPage() {
  // atomWithStorage(localStorage)는 기본(getOnInit=false)이라 첫 렌더는 초기값 → 마운트 후
  // 저장값으로 갱신된다(SSR/CSR 첫 렌더 일치, hydration mismatch 없음).
  const [selected, setSelected] = useAtom(selectedTemplateAtom);
  const [holdings, setHoldings] = useAtom(holdingsAtom);
  const [customTarget, setCustomTarget] = useAtom(customTargetAtom);

  const isCustom = selected === 'CUSTOM';
  const template = selected ? getTemplate(selected) : undefined;
  const target = isCustom ? customTarget : template?.allocations;
  const customValid = !isCustom || customTargetSum(customTarget) === 100;

  const diagnosis = useMemo(
    () => (target ? diagnose(target, holdings) : null),
    [target, holdings],
  );

  const reset = () => {
    setSelected(null);
    setHoldings(EMPTY_HOLDINGS);
    setCustomTarget(EMPTY_TARGET);
  };

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-8 overflow-y-auto no-scrollbar p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl tracking-tight">포트폴리오 진단</h1>
          <p className="mt-1 text-sm text-muted-foreground break-keep">
            모델 포트폴리오를 고르고 내 자산을 입력하면, 어디가 과하고 부족한지·
            위험 성향이 목표에 맞는지 진단해 드려요.
          </p>
        </div>
        {selected && (
          <ConfirmDialog
            title="입력을 초기화할까요?"
            description="선택한 포트폴리오와 입력한 자산 정보가 모두 지워집니다."
            confirmLabel="초기화"
            onConfirm={reset}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">초기화</span>
              </Button>
            }
          />
        )}
      </header>

      {/* 1. 모델 포트폴리오 선택 */}
      <section className="flex flex-col gap-3">
        <SectionLabel step={1} title="목표 포트폴리오 선택" />
        <TemplateSelector selected={selected} onSelect={setSelected} />
      </section>

      {/* 2. 자산 입력 + 3. 진단 */}
      {selected && (
        <>
          <section className="flex flex-col gap-3">
            <SectionLabel step={2} title="내 자산 입력" />
            <HoldingsInput
              holdings={holdings}
              setHoldings={setHoldings}
              isCustom={isCustom}
              customTarget={customTarget}
              setCustomTarget={setCustomTarget}
            />
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel step={3} title="진단 결과" />
            {diagnosis && customValid ? (
              <DiagnosisResult result={diagnosis} />
            ) : (
              <EmptyResult
                reason={
                  !customValid
                    ? '목표 비중의 합이 100%가 되도록 입력해 주세요.'
                    : '자산을 입력하면 진단이 표시됩니다.'
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}

function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums">
        {step}
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function EmptyResult({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
      <Wallet className="size-6 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground break-keep">{reason}</p>
    </div>
  );
}
