'use client';

import { Toaster } from '../ui/sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      // richColors 옵션을 켜면 기본 색상이 적용되지만,
      // 아래 classNames 설정을 통해 우리가 원하는 색으로 완전히 바꿀 수 있습니다.
      toastOptions={{
        classNames: {
          // 기본 토스트 스타일
          toast:
            'group border shadow-md rounded-2xl flex items-center p-4 gap-3',

          // ✅ Promise / Loading (보라)
          loading: '!bg-violet-100 !text-violet-800 !border-violet-200',

          // 성공 (민트/그린)
          success: '!bg-emerald-100 !text-emerald-800 !border-emerald-200',

          // 에러 (레드/핑크)
          error: '!bg-rose-100 !text-rose-800 !border-rose-200',

          // 정보 (블루)
          info: '!bg-sky-100 !text-sky-800 !border-sky-200',

          // 경고 (옐로우/오렌지)
          warning: '!bg-amber-100 !text-amber-800 !border-amber-200',

          // 부가 설명 텍스트
          description: 'group-[.toast]:!text-slate-600 text-xs font-medium',

          // 버튼 스타일 (필요시)
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
}
