'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { ASSET_CLASSES, type AssetClass } from '@/constants/asset-classes';
import {
  getTemplate,
  type TemplateId,
} from '@/constants/portfolio-templates';
import { CURRENCY_SYMBOL } from '@/constants/portfolio-currency';
import { customTargetSum, diagnose } from '@/lib/portfolio/diagnose';
import { cn } from '@/lib/utils';
import {
  EMPTY_HOLDINGS,
  customTargetAtom,
  holdingsAtom,
  portfolioCurrencyAtom,
  selectedTemplateAtom,
} from '@/store/portfolio-atom';
import { useAtom } from 'jotai';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Wallet } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
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

const STEPS = [
  { n: 1, title: '목표 포트폴리오 선택' },
  { n: 2, title: '내 자산 입력' },
  { n: 3, title: '진단 결과' },
] as const;

// 좌우 슬라이드 — 앞으로(dir>0)면 오른쪽에서 들어와 왼쪽으로 나가고, 뒤로가면 반대.
const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// 마이페이지 — 포트폴리오 진단(슬라이드 위저드). 1) 모델 선택 → 2) 자산 입력 → 3) 진단.
// 1단계에서 고르면 자동으로 2단계로 슬라이드. MVP: 서버 저장 없이 localStorage 보존.
export default function PortfolioPage() {
  // atomWithStorage(localStorage)는 기본(getOnInit=false)이라 첫 렌더는 초기값 → 마운트 후
  // 저장값으로 갱신된다(SSR/CSR 첫 렌더 일치, hydration mismatch 없음).
  const [selected, setSelected] = useAtom(selectedTemplateAtom);
  const [holdings, setHoldings] = useAtom(holdingsAtom);
  const [customTarget, setCustomTarget] = useAtom(customTargetAtom);
  const [currency] = useAtom(portfolioCurrencyAtom);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const isCustom = selected === 'CUSTOM';
  const template = selected ? getTemplate(selected) : undefined;
  const target = isCustom ? customTarget : template?.allocations;
  const customValid = !isCustom || customTargetSum(customTarget) === 100;

  const diagnosis = useMemo(
    () => (target ? diagnose(target, holdings) : null),
    [target, holdings],
  );

  const goTo = (next: number) => {
    setDirection(next >= step ? 1 : -1);
    setStep(next);
  };

  // 1단계에서 모델을 고르면 곧바로 2단계로 넘어간다(슬라이드).
  const handleSelect = (id: TemplateId) => {
    setSelected(id);
    goTo(2);
  };

  const reset = () => {
    setSelected(null);
    setHoldings(EMPTY_HOLDINGS);
    setCustomTarget(EMPTY_TARGET);
    goTo(1);
  };

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
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

      <Stepper
        current={step}
        canGoStep={(n) => n === 1 || !!selected}
        onStep={goTo}
      />

      {/* 슬라이드 영역 — 단계 전환 시 좌우로 넘어간다.
          가로만 clip: overflow-hidden이면 종목검색 드롭다운(absolute)까지 잘린다.
          overflow-x-clip은 y축 visible을 유지하는 유일한 조합(hidden은 y를 auto로 만듦). */}
      <div className="relative overflow-x-clip">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {step === 1 && (
              <TemplateSelector selected={selected} onSelect={handleSelect} />
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <HoldingsInput
                  holdings={holdings}
                  setHoldings={setHoldings}
                  isCustom={isCustom}
                  customTarget={customTarget}
                  setCustomTarget={setCustomTarget}
                  target={target ?? customTarget}
                />
                <StepNav
                  onBack={() => goTo(1)}
                  onNext={() => goTo(3)}
                  nextLabel="진단 결과 보기"
                  nextDisabled={!customValid}
                  hint={
                    !customValid
                      ? '목표 비중의 합이 100%가 되어야 다음으로 넘어갈 수 있어요.'
                      : undefined
                  }
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6">
                {diagnosis && customValid ? (
                  <DiagnosisResult
                    result={diagnosis}
                    currencySymbol={CURRENCY_SYMBOL[currency]}
                  />
                ) : (
                  <EmptyResult
                    reason={
                      !customValid
                        ? '목표 비중의 합이 100%가 되도록 입력해 주세요.'
                        : '자산을 입력하면 진단이 표시됩니다.'
                    }
                  />
                )}
                <StepNav onBack={() => goTo(2)} backLabel="자산 다시 입력" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

// 진행 스텝(1-2-3). 데스크톱은 라벨까지, 모바일은 뱃지 + 현재 단계 제목.
function Stepper({
  current,
  canGoStep,
  onStep,
}: {
  current: number;
  canGoStep: (n: number) => boolean;
  onStep: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <nav className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = s.n < current;
          const active = s.n === current;
          const clickable = canGoStep(s.n) && s.n !== current;
          return (
            <Fragment key={s.n}>
              <button
                type="button"
                onClick={() => clickable && onStep(s.n)}
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full transition-colors',
                  clickable && 'cursor-pointer',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : done
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-3.5" /> : s.n}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium sm:inline',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 bg-border" />
              )}
            </Fragment>
          );
        })}
      </nav>
      {/* 모바일: 현재 단계 제목 */}
      <h2 className="text-base font-semibold text-foreground sm:hidden">
        {STEPS[current - 1]?.title}
      </h2>
    </div>
  );
}

// 단계 이동 버튼(이전/다음). hint는 다음 비활성 사유 안내.
function StepNav({
  onBack,
  backLabel = '이전',
  onNext,
  nextLabel,
  nextDisabled,
  hint,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
      {hint && (
        <p className="text-right text-[11px] text-amber-500 break-keep">{hint}</p>
      )}
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
