import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface PredictLogicInsightsProps {
  summary?: string;
  rationale?: string;
}

// 예측의 한 줄 요약(summary)과 상세 근거(rationale, 마크다운)를 풀폭 카드로 표시.
export default function PredictLogicInsights({
  summary,
  rationale,
}: PredictLogicInsightsProps) {
  return (
    <div className="md:col-span-8 bg-card rounded-3xl border border-border p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
          <span className="w-1.5 h-4 bg-primary rounded-sm" />
          Prediction Logic Insights
        </h3>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {summary}
        </h2>
      </div>
      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-headings:border-b prose-headings:border-border prose-headings:pb-2 prose-a:text-primary prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-primary prose-ul:text-foreground prose-li:marker:text-primary">
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {rationale?.replace(/\\n/g, '\n')}
        </Markdown>
      </div>
    </div>
  );
}
