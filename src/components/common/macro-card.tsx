import { ArrowRight, HelpCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type Status = 'Good' | 'Neutral' | 'Bad';

interface Indicator {
  id: string;
  name: string;
  icon: React.ElementType;
  valueMain: string;
  valueSuffix: string;
  status: Status;
  description: string;
  marketImpact: string;
  relationIcon1: string;
  relationText1: string;
  relationIcon2: string;
  relationText2: string;
}

export function MacroCard({ indicator }: { indicator: Indicator }) {
  const Icon = indicator.icon;

  const statusColors = {
    Good: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    Neutral: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    Bad: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-5 lg:p-6 group hover:border-border transition-colors relative overflow-hidden flex flex-col h-full min-h-[160px] shadow-none ring-0 gap-0">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-foreground/[0.02] to-transparent pointer-events-none group-hover:from-foreground/[0.04] transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border shadow-sm">
            <Icon className="w-4 h-4 text-foreground/70" />
          </div>
          <p className="text-sm font-semibold text-foreground tracking-wide">
            {indicator.name}
          </p>
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
                {indicator.name}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">
                  {indicator.description.split(' - ')[0]}
                </span>
                - {indicator.description.split(' - ')[1]}
              </p>
              <div className="bg-secondary/50 rounded-lg p-3.5 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground mr-1.5">
                  시장 영향:
                </span>
                {indicator.marketImpact}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <div className="flex items-baseline gap-3 mb-4 relative z-10">
          <h2 className="text-4xl font-sans font-semibold text-foreground tracking-tight tabular-nums flex items-baseline">
            {indicator.valueMain}
            <span className="text-2xl font-medium text-muted-foreground/80 ml-[2px]">
              {indicator.valueSuffix}
            </span>
          </h2>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${statusColors[indicator.status]}`}
          >
            {indicator.status}
          </span>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground bg-secondary/50 border border-border/40 px-2.5 py-1.5 rounded-lg w-full sm:w-auto">
            <span>{indicator.relationIcon1}</span>
            <span>{indicator.relationText1}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/30 mx-0.5 shrink-0" />
            <span>{indicator.relationIcon2}</span>
            <span
              className={`font-semibold ${indicator.status === 'Bad' ? 'text-red-400' : 'text-foreground/90'}`}
            >
              {indicator.relationText2}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
