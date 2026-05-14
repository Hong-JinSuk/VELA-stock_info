import { ShieldCheck } from 'lucide-react';

// 예측 폼 하단에 노출되는 투자 책임 고지 카드. AI 결과가 참고 자료임을 안내한다.
export default function PredictSystemNotice() {
  return (
    <div className="bg-card rounded-3xl border border-border p-6 flex flex-col justify-center gap-2 shrink-0">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        시스템 알림
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        본 서비스에서 제공하는 모든 정보는 AI 모델에 기반한 투자 참고 자료이며,
        투자 권유나 수익을 보장하지 않습니다. 투자의 최종 결정과 그로 인한
        결과에 대한 책임은 본인에게 있으며, 과거의 성과가 미래의 수익을 담보하지
        않음을 유의하시기 바랍니다.
      </p>
    </div>
  );
}
