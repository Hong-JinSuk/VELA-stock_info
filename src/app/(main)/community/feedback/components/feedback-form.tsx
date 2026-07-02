'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_CATEGORY_ORDER,
} from '@/constants/community';
import {
  useCreatePost,
  useUpdatePost,
} from '@/lib/services/community/use-community-posts';
import { cn } from '@/lib/utils';
import { createPostSchema } from '@/schemas/community-schema';
import type { FeedbackCategory, PostItem } from '@/types/community';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

// 제목/내용만 zod 검증, 카테고리는 별도 상태(칩 선택).
const formSchema = createPostSchema.pick({ title: true, content: true });
type FormValues = z.infer<typeof formSchema>;

// 전체 화면 컴포저. 내용 textarea가 남는 세로 공간을 채운다(flex-1 + field-sizing 고정).
export default function FeedbackForm({
  mode,
  initial,
  onDone,
}: {
  mode: 'create' | 'edit';
  initial?: PostItem;
  onDone?: () => void;
}) {
  const create = useCreatePost('FEEDBACK');
  const update = useUpdatePost('FEEDBACK');
  const [category, setCategory] = useState<FeedbackCategory>(
    initial?.category ?? 'ETC',
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
    },
  });

  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit((v) => {
    if (mode === 'create') {
      create.mutate(
        { ...v, category },
        {
          onSuccess: () => {
            reset();
            setCategory('ETC');
            onDone?.();
          },
        },
      );
      return;
    }
    if (!initial) return;
    update.mutate(
      { id: initial.id, ...v, category },
      { onSuccess: () => onDone?.() },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">분류</span>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors',
                category === c
                  ? 'border-blue-500/50 bg-blue-500/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {FEEDBACK_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Input
          {...register('title')}
          placeholder="제목"
          maxLength={120}
          aria-invalid={Boolean(errors.title)}
          className="h-11 text-base"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <Textarea
          {...register('content')}
          placeholder="개선 아이디어·버그·있으면 하는 기능 등을 자유롭게 남겨주세요"
          maxLength={5000}
          aria-invalid={Boolean(errors.content)}
          className="min-h-48 flex-1 resize-none text-base leading-relaxed [field-sizing:fixed]"
        />
        {errors.content && (
          <p className="text-xs text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? '등록' : '수정 완료'}
        </Button>
      </div>
    </form>
  );
}
