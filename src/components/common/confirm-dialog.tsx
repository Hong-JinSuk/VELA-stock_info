'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// 공용 확인 모달 — 삭제 등 되돌릴 수 없는 액션은 항상 이걸 거쳐 한 번 더 묻는다.
// trigger(삭제 버튼 등)를 asChild로 감싸 클릭 시 모달을 띄우고, 확인 시 onConfirm 실행.
export default function ConfirmDialog({
  trigger,
  title,
  description = '이 작업은 되돌릴 수 없습니다.',
  confirmLabel = '삭제',
  cancelLabel = '취소',
  destructive = true,
  onConfirm,
}: {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              destructive && 'bg-red-600 text-white hover:bg-red-600/90',
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
