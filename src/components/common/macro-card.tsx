import type { MacroIndicator } from '@/types/macro-indicator';
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

type Status = 'Good' | 'Neutral' | 'Bad';

// 카드 ID와 무관하게 displayMeta.iconName으로 매핑.
// 미등록 이름은 Gauge로 폴백.
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

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Gauge;
}

function computeStatus(
  value: number,
  meta: MacroIndicator['displayMeta'],
): Status {
  const { thresholdGood, thresholdBad, invertThreshold } = meta;
  if (thresholdGood === undefined || thresholdBad === undefined)
    return 'Neutral';
  if (invertThreshold) {
    if (value >= thresholdGood) return 'Good';
    if (value <= thresholdBad) return 'Bad';
    return 'Neutral';
  }
  if (value <= thresholdGood) return 'Good';
  if (value >= thresholdBad) return 'Bad';
  return 'Neutral';
}

// 18.523 → { main: "18", suffix: ".52" } (valueDecimals=2)
function splitValue(
  value: number,
  decimals: number,
): { main: string; suffix: string } {
  const fixed = value.toFixed(decimals);
  if (decimals === 0) return { main: fixed, suffix: '' };
  const [intPart, fracPart] = fixed.split('.');
  return { main: intPart, suffix: `.${fracPart}` };
}

// "2026-05-30" → { mmdd: "5/30", daysUntil: 12 } (오늘이 5/18일 때)
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

type MacroCardProps = {
  indicator: MacroIndicator;
};

export function MacroCard({ indicator }: MacroCardProps) {
  const { displayMeta, value } = indicator;
  const Icon = resolveIcon(displayMeta.iconName);
  const status = computeStatus(value, displayMeta);
  const { main, suffix: decimalSuffix } = splitValue(
    value,
    displayMeta.valueDecimals,
  );
  const valueSuffix = `${decimalSuffix}${displayMeta.unitSuffix}`;
  const name = displayMeta.cardName;
  const nextRelease = formatNextRelease(indicator.nextReleaseDate);

  const statusColors: Record<Status, string> = {
    Good: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    Neutral: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    Bad: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  // "타이틀 - 본문" 분리 (없으면 통째로 본문 처리)
  const [descTitle, descBody] = displayMeta.description.split(' - ');

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-5 lg:p-6 group hover:border-border transition-colors relative overflow-hidden flex flex-col h-full min-h-[160px] shadow-none ring-0 gap-0">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-foreground/[0.02] to-transparent pointer-events-none group-hover:from-foreground/[0.04] transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border shadow-sm">
            <Icon className="w-4 h-4 text-foreground/70" />
          </div>
          <p className="text-sm font-semibold text-foreground tracking-wide">
            {name}
          </p>
          {nextRelease && (
            <div className="mt-2 text-[10px] text-muted-foreground/70 tracking-wide">
              다음 발표 {nextRelease.mmdd}
              <span className="ml-1 text-muted-foreground/50">
                (D-{nextRelease.daysUntil})
              </span>
            </div>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors outline-none -mr-1 -mt-1 p-1 rounded-md hover:bg-secondary">
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
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <div className="flex items-baseline gap-3 mb-4 relative z-10">
          <h2 className="text-4xl font-sans font-semibold text-foreground tracking-tight tabular-nums flex items-baseline">
            {main}
            <span className="text-2xl font-medium text-muted-foreground/80 ml-[2px]">
              {valueSuffix}
            </span>
          </h2>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${statusColors[status]}`}
          >
            {status}
          </span>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground bg-secondary/50 border border-border/40 px-2.5 py-1.5 rounded-lg w-full sm:w-auto">
            <span>{displayMeta.relationIcon1}</span>
            <span>{displayMeta.relationText1}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/30 mx-0.5 shrink-0" />
            <span>{displayMeta.relationIcon2}</span>
            <span
              className={`font-semibold ${status === 'Bad' ? 'text-red-400' : 'text-foreground/90'}`}
            >
              {displayMeta.relationText2}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
