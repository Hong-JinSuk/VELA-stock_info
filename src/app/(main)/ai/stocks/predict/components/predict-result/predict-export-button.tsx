'use client';

import { cn } from '@/lib/utils';
import { Download, Loader2 } from 'lucide-react';

interface PredictExportButtonProps {
  onClick: () => void;
  isExporting: boolean;
}

// 예측 결과 영역을 PDF로 내보내는 트리거 버튼. 데스크톱(sm 이상)에서만 노출된다.
export default function PredictExportButton({
  onClick,
  isExporting,
}: PredictExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isExporting}
      data-export-ignore="true"
      className={cn(
        'hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded-full outline-none',
        isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-3 h-3" />
          Export PDF
        </>
      )}
    </button>
  );
}
