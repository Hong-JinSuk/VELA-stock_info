import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface PredictScenarioCardProps {
  type: 'bull' | 'bear';
  title: string;
  icon: React.ReactNode;
  content?: string;
}

// Bull/Bear 시나리오 본문(마크다운)을 색상 구분 카드로 렌더. type에 따라 강조색이 primary/rose로 바뀐다.
export default function PredictScenarioCard({
  type,
  title,
  icon,
  content,
}: PredictScenarioCardProps) {
  const isBull = type === 'bull';

  return (
    <div className="md:col-span-4 bg-card rounded-3xl border border-border p-6 flex flex-col relative overflow-hidden group">
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          isBull ? 'bg-primary' : 'bg-rose-500',
        )}
      />
      <h3
        className={cn(
          'text-[10px] font-black mb-3 uppercase tracking-widest flex items-center gap-2',
          isBull ? 'text-primary' : 'text-rose-400',
        )}
      >
        {icon} {title}
      </h3>
      <div
        className={cn(
          'prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-p:text-foreground prose-p:leading-relaxed prose-ul:text-foreground',
          isBull
            ? 'prose-strong:text-primary prose-li:marker:text-primary'
            : 'prose-strong:text-rose-400 prose-li:marker:text-rose-400',
        )}
      >
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {content?.replace(/\\n/g, '\n')}
        </Markdown>
      </div>
    </div>
  );
}
