'use client';

import StarRating from '@/components/common/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreatePost,
  useUpdatePost,
} from '@/lib/services/community/use-community-posts';
import { createPostSchema } from '@/schemas/community-schema';
import type { ReviewItem } from '@/types/community';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

// 제목/내용만 폼 검증(zod), 별점은 별도 상태(StarRating 커스텀 위젯).
const formSchema = createPostSchema.pick({ title: true, content: true });
type FormValues = z.infer<typeof formSchema>;

export default function ReviewForm({
  mode,
  initial,
  canRate,
  onDone,
}: {
  mode: 'create' | 'edit';
  initial?: ReviewItem;
  canRate: boolean; // 별점 입력 노출 여부(보드 정책 통과 시 true)
  onDone?: () => void;
}) {
  const create = useCreatePost('REVIEW');
  const update = useUpdatePost('REVIEW');
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);

  const {
    register,
    handleSubmit,
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
        { ...v, ...(canRate && rating ? { rating } : {}) },
        { onSuccess: () => onDone?.() },
      );
      return;
    }
    if (!initial) return;
    update.mutate(
      { id: initial.id, ...v, ...(canRate ? { rating } : {}) },
      { onSuccess: () => onDone?.() },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {canRate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">별점</span>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating != null && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              지우기
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Input
          {...register('title')}
          placeholder="제목"
          maxLength={120}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Textarea
          {...register('content')}
          placeholder="서비스 사용 후기를 남겨주세요"
          rows={4}
          maxLength={5000}
          className="resize-none"
          aria-invalid={Boolean(errors.content)}
        />
        {errors.content && (
          <p className="text-xs text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {mode === 'edit' && onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {mode === 'create' ? '후기 등록' : '수정 완료'}
        </Button>
      </div>
    </form>
  );
}
