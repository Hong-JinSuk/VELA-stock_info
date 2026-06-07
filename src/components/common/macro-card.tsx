import { useIsMobile } from '@/hooks/use-mobile';
import type { IndicatorState, MacroIndicator } from '@/types/macro-indicator';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart,
  BarChart3,
  Coins,
  DollarSign,
  Droplet,
  Eye,
  Factory,
  Flame,
  Fuel,
  Gauge,
  Hammer,
  HelpCircle,
  Home,
  House,
  Landmark,
  LineChart,
  Percent,
  PiggyBank,
  Scale,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  Thermometer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type Status = 'Good' | 'Neutral' | 'Bad';

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart,
  BarChart3,
  Coins,
  DollarSign,
  Droplet,
  Eye,
  Factory,
  Flame,
  Fuel,
  Gauge,
  Hammer,
  Home,
  House,
  Landmark,
  LineChart,
  Percent,
  PiggyBank,
  Scale,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  Thermometer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
};

const FALLBACK_STATE: IndicatorState = {
  icon: '📊',
  label: '갱신 중',
  resultIcon: '⏳',
  resultLabel: '다음 배치 후 표시',
};

type MacroCardProps = {
  indicator: MacroIndicator;
};

export function MacroCard({ indicator }: MacroCardProps) {
  const isMobile = useIsMobile();
  const { displayMeta, value } = indicator;
  const Icon = resolveIcon(displayMeta.iconName);
  const status = computeStatus(indicator);
  const currentState = pickState(displayMeta.states, status);
  const { main, suffix: decimalSuffix } = formatValue(
    value,
    displayMeta.valueDecimals,
    displayMeta.unitSuffix,
  );
  const valueSuffix = `${decimalSuffix}${displayMeta.unitSuffix}`;
  const fontClass = valueFontClass(main.length + valueSuffix.length);
  const name = displayMeta.cardName;
  const nextRelease = formatNextRelease(indicator.nextReleaseDate);

  const statusColors: Record<Status, string> = {
    Good: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    Neutral: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    Bad: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  const [descTitle, descBody] = displayMeta.description.split(' - ');

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-5 lg:p-6 group hover:border-border transition-colors relative overflow-hidden flex flex-col h-full min-h-[160px] shadow-none ring-0 gap-0">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-foreground/[0.02] to-transparent pointer-events-none group-hover:from-foreground/[0.04] transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex flex-col items-start gap-2.5 min-w-0">
          <div className="flex items-center w-full gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border shadow-sm shrink-0">
              <Icon className="w-4 h-4 text-foreground/70" />
            </div>
            <p className="text-sm font-semibold text-foreground tracking-wide truncate">
              {name}
            </p>
          </div>
          {nextRelease && (
            <div className="text-[10px] text-muted-foreground/70 tracking-wide whitespace-nowrap">
              다음 발표 {nextRelease.mmdd}
              <span className="ml-1 text-muted-foreground/50">
                (D-{nextRelease.daysUntil})
              </span>
            </div>
          )}
        </div>
        {isMobile ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors outline-none -mr-1 -mt-1 p-1 rounded-md hover:bg-secondary shrink-0">
                <HelpCircle className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-5 border-border bg-card shadow-lg rounded-xl"
              align="end"
            >
              <div className="space-y-3.5">
                <h4 className="font-semibold text-sm flex items-center gap-2.5 text-foreground">
                  <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center border border-border">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {descBody ? (
                    <>
                      <span className="text-foreground font-medium">
                        {descTitle}
                      </span>
                      {' - '}
                      {descBody}
                    </>
                  ) : (
                    descTitle
                  )}
                </p>
                <div className="bg-secondary/50 rounded-lg p-3.5 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground mr-1.5">
                    시장 영향:
                  </span>
                  {displayMeta.marketImpact}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                    상태별 해석
                  </p>
                  <StateRow
                    state={displayMeta.states?.good}
                    tone="good"
                    active={status === 'Good'}
                  />
                  <StateRow
                    state={displayMeta.states?.neutral}
                    tone="neutral"
                    active={status === 'Neutral'}
                  />
                  <StateRow
                    state={displayMeta.states?.bad}
                    tone="bad"
                    active={status === 'Bad'}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button>
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="w-80 p-5 border-border bg-card shadow-lg rounded-xl"
              align="end"
              showArrow={false}
            >
              <div className="space-y-3.5">
                <h4 className="font-semibold text-sm flex items-center gap-2.5 text-foreground">
                  <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center border border-border">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {descBody ? (
                    <>
                      <span className="text-foreground font-medium">
                        {descTitle}
                      </span>
                      {' - '}
                      {descBody}
                    </>
                  ) : (
                    descTitle
                  )}
                </p>
                <div className="bg-secondary/50 rounded-lg p-3.5 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground mr-1.5">
                    시장 영향:
                  </span>
                  {displayMeta.marketImpact}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                    상태별 해석
                  </p>
                  <StateRow
                    state={displayMeta.states?.good}
                    tone="good"
                    active={status === 'Good'}
                  />
                  <StateRow
                    state={displayMeta.states?.neutral}
                    tone="neutral"
                    active={status === 'Neutral'}
                  />
                  <StateRow
                    state={displayMeta.states?.bad}
                    tone="bad"
                    active={status === 'Bad'}
                  />
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end min-w-0">
        <div className="flex items-baseline gap-2 mb-4 relative z-10 min-w-0">
          <h2
            className={`${fontClass} font-sans font-semibold text-foreground tracking-tight tabular-nums flex items-baseline min-w-0 truncate`}
          >
            {main}
            <span className="text-base font-medium text-muted-foreground/80 ml-[2px] whitespace-nowrap">
              {valueSuffix}
            </span>
          </h2>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border shrink-0 ${statusColors[status]}`}
          >
            {status}
          </span>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide bg-secondary/50 border border-border/40 px-2.5 py-1.5 rounded-lg max-w-full">
            <span className="shrink-0">{currentState.icon}</span>
            <span className="font-semibold text-foreground/90 whitespace-nowrap">
              {currentState.label}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-0.5 shrink-0" />
            <span className="shrink-0">{currentState.resultIcon}</span>
            <span
              className={`font-semibold whitespace-nowrap ${
                status === 'Bad' ? 'text-red-400' : 'text-foreground/90'
              }`}
            >
              {currentState.resultLabel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

type StateRowProps = {
  state: IndicatorState | undefined;
  tone: 'good' | 'neutral' | 'bad';
  active: boolean;
};

function StateRow({ state, tone, active }: StateRowProps) {
  if (!state) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40 px-2 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
        <span>—</span>
      </div>
    );
  }
  const toneColor: Record<typeof tone, string> = {
    good: 'bg-emerald-500',
    neutral: 'bg-amber-500',
    bad: 'bg-red-500',
  };
  return (
    <div
      className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
        active ? 'bg-secondary' : ''
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneColor[tone]}`}
      />
      <span className="shrink-0">{state.icon}</span>
      <span className="font-semibold text-foreground/90">{state.label}</span>
      <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-0.5 shrink-0" />
      <span className="shrink-0">{state.resultIcon}</span>
      <span className="text-muted-foreground">{state.resultLabel}</span>
    </div>
  );
}

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Gauge;
}

// status 결정 우선순위:
//  1. trendGood/trendBad가 있으면 changePercent 기준 (이전 대비 추세)
//  2. thresholdGood/thresholdBad가 있으면 value 절대값 기준
//  3. 둘 다 없으면 Neutral
function computeStatus(indicator: MacroIndicator): Status {
  const { value, changePercent, displayMeta } = indicator;
  const {
    thresholdGood,
    thresholdBad,
    invertThreshold,
    trendGood,
    trendBad,
    invertTrend,
  } = displayMeta;

  // 1. trend 기반 (changePercent)
  if (
    trendGood !== undefined &&
    trendBad !== undefined &&
    changePercent !== null
  ) {
    if (invertTrend) {
      if (changePercent >= trendGood) return 'Good';
      if (changePercent <= trendBad) return 'Bad';
      return 'Neutral';
    }
    if (changePercent <= trendGood) return 'Good';
    if (changePercent >= trendBad) return 'Bad';
    return 'Neutral';
  }

  // 2. value threshold
  if (thresholdGood !== undefined && thresholdBad !== undefined) {
    if (invertThreshold) {
      if (value >= thresholdGood) return 'Good';
      if (value <= thresholdBad) return 'Bad';
      return 'Neutral';
    }
    if (value <= thresholdGood) return 'Good';
    if (value >= thresholdBad) return 'Bad';
    return 'Neutral';
  }

  return 'Neutral';
}

// 큰 숫자는 K/M/B 단축. 1000 단위 그룹화 (,).
// unitSuffix가 'K호' 같이 이미 K/M 포함된 경우 단축 안 함(중복 방지).
function formatValue(
  value: number,
  decimals: number,
  unitSuffix: string,
): { main: string; suffix: string } {
  const hasUnitPrefix = /^[KMB]/.test(unitSuffix);
  const abs = Math.abs(value);

  // 1M 이상이면 short. K호처럼 단위 prefix가 이미 있으면 단축 X (수치 자체만 그룹화).
  if (!hasUnitPrefix && abs >= 1_000_000) {
    return splitDecimal((value / 1_000_000).toFixed(2)).withSuffix('M');
  }
  if (!hasUnitPrefix && abs >= 100_000) {
    return splitDecimal((value / 1_000).toFixed(1)).withSuffix('K');
  }

  // 4자리 이상은 천 단위 그룹화. 소수 부분 분리.
  const fixed = value.toFixed(decimals);
  if (decimals === 0) {
    const grouped = Number(fixed).toLocaleString('en-US');
    return { main: grouped, suffix: '' };
  }
  const [intPart, fracPart] = fixed.split('.');
  const groupedInt = Number(intPart).toLocaleString('en-US');
  return { main: groupedInt, suffix: `.${fracPart}` };
}

function splitDecimal(fixed: string) {
  const [intPart, fracPart] = fixed.split('.');
  const groupedInt = Number(intPart).toLocaleString('en-US');
  return {
    withSuffix(unit: 'K' | 'M') {
      return {
        main: groupedInt,
        suffix: fracPart ? `.${fracPart}${unit}` : unit,
      };
    },
  };
}

// 값의 자릿수에 따라 폰트 자동 축소. 카드 폭이 작을 때 깨짐 방지.
function valueFontClass(displayLength: number): string {
  if (displayLength >= 9) return 'text-xl';
  if (displayLength >= 7) return 'text-2xl';
  if (displayLength >= 5) return 'text-3xl';
  return 'text-4xl';
}

function formatNextRelease(
  date: string | null,
): { mmdd: string; daysUntil: number } | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const mmdd = `${target.getMonth() + 1}/${target.getDate()}`;
  return { mmdd, daysUntil: diff };
}

function pickState(
  states: MacroIndicator['displayMeta']['states'] | undefined,
  status: Status,
): IndicatorState {
  if (!states) return FALLBACK_STATE;
  if (status === 'Good' && states.good) return states.good;
  if (status === 'Bad' && states.bad) return states.bad;
  return states.neutral ?? FALLBACK_STATE;
}
