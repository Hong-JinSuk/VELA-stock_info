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

          // 부가 설명 텍스트 - sonner 내부의 다크 테마 description 룰(거의 흰색)을 덮어쓰기 위해 `!` 사용
          description:
            'text-xs font-medium group-data-[type=success]:!text-emerald-700 group-data-[type=error]:!text-rose-700 group-data-[type=info]:!text-sky-700 group-data-[type=warning]:!text-amber-700 group-data-[type=loading]:!text-violet-700',

          // 액션/취소 버튼: 토스트 배경과 대비되도록 타입별 진한 색을 사용
          actionButton:
            'group-data-[type=success]:!bg-emerald-600 group-data-[type=error]:!bg-rose-600 group-data-[type=info]:!bg-sky-600 group-data-[type=warning]:!bg-amber-600 group-data-[type=loading]:!bg-violet-600 !text-white',
          cancelButton: '!bg-muted !text-muted-foreground',
        },
      }}
    />
  );
}
