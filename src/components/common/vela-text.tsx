import { VelaLogo } from './vela-logo';

interface VelaTextProps {
  logoSize?: number;
  textSize?: number;
  className?: string; // 외부에서 여백(margin) 등을 줄 때 유용합니다
}

export default function VelaText({
  logoSize = 42,
  textSize = 20,
  className = '',
}: VelaTextProps) {
  const subTextSize = Math.max(textSize * 0.5, 8);
  const textGap = textSize * 0.2;

  const dividerHeight = logoSize * 0.95;
  const containerGap = logoSize * 0.38;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: containerGap }}
    >
      <VelaLogo size={logoSize} className="text-slate-900 dark:text-white" />

      <div
        className="w-px bg-slate-300 dark:bg-slate-700 transition-all"
        style={{ height: dividerHeight }}
      />

      <div className="flex flex-col" style={{ gap: textGap }}>
        <span
          className="font-serif font-medium tracking-[0.24em] leading-none text-slate-900 dark:text-white transition-all"
          style={{ fontSize: textSize }}
        >
          VELA
        </span>
        <span
          className="font-serif font-normal tracking-[0.32em] leading-none text-slate-600 dark:text-slate-400 transition-all"
          style={{ fontSize: subTextSize }}
        >
          MARKET &nbsp; INTELLIGENCE
        </span>
      </div>
    </div>
  );
}
