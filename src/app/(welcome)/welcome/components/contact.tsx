'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useContact } from '@/lib/services/mail/use-contact';
import { FadeInView } from '@/motion/fade-in-view';
import { contactSchema } from '@/schemas/contact-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { Session } from 'next-auth';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormValues = z.infer<typeof contactSchema>;

const EMPTY: FormValues = {
  author: '',
  authorEmail: '',
  title: '',
  content: '',
  website: '',
};

const NOTES = [
  {
    icon: <MailCheck className="size-4" />,
    text: '남겨주신 이메일로 직접 답장드립니다.',
  },
  {
    icon: <MessageSquare className="size-4" />,
    text: '기능 제안·오류 제보·제휴 문의 모두 환영합니다.',
  },
  {
    icon: <ShieldCheck className="size-4" />,
    text: '입력하신 정보는 답변 용도로만 사용됩니다.',
  },
];

type Props = {
  session?: Session | null;
};

// 랜딩(welcome) 하단 문의 섹션. 헤더의 '문의하기'(#contact) 목적지.
// 로그인 없이 방문자가 개발자에게 메일을 보낼 수 있게 이름/이메일까지 직접 입력받는다
// (사이드바 NavDeveloperMail은 로그인 계정 값으로 고정하는 반면 여기선 수정 가능).
export function Contact({ session }: Props) {
  const {
    postContact: { mutateAsync: sendMail, isPending },
  } = useContact();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: EMPTY,
  });

  const user = session?.user;

  // 로그인 상태면 이름/이메일을 채워 준다. 이미 입력한 값은 덮어쓰지 않는다.
  useEffect(() => {
    if (!user) return;
    const name = user.name || user.nickname || '';
    if (name && !getValues('author')) setValue('author', name);
    if (user.email && !getValues('authorEmail'))
      setValue('authorEmail', user.email);
  }, [user, getValues, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const req = sendMail(values);
    toast.promise(req, {
      loading: '메일을 보내는 중입니다...',
      success: '문의를 보냈습니다! 확인 후 답장드릴게요. 📧',
      error: (e: unknown) =>
        e instanceof Error
          ? e.message
          : '메일 전송에 실패했습니다. 다시 시도해주세요.',
    });
    try {
      await req;
      // 이름/이메일은 남겨 두고 제목·내용만 비운다(연속 문의 편의).
      reset({
        ...EMPTY,
        author: values.author,
        authorEmail: values.authorEmail,
      });
    } catch {
      // 실패 시 입력값을 유지해 재시도할 수 있게 둔다. 에러 토스트는 toast.promise가 처리.
    }
  });

  return (
    <section
      id="contact"
      className="scroll-mt-20 py-24 sm:py-32 border-t border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0F1115]"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <FadeInView>
            <div className="max-w-xl">
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mb-6 break-keep">
                궁금한 점이 있으신가요?
                <br />
                직접 답변드립니다.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 break-keep">
                VELA는 한 사람이 만들고 있는 서비스입니다. 서비스에 대한 질문,
                이런 기능이 있었으면 하는 바람, 사용 중 마주친 오류까지 편하게
                남겨주세요. 보내주신 내용은 개발자에게 바로 전달됩니다.
              </p>

              <div className="w-20 h-px bg-slate-300 dark:bg-slate-700 mb-8"></div>

              <ul className="space-y-3">
                {NOTES.map((note) => (
                  <li
                    key={note.text}
                    className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 break-keep"
                  >
                    <span className="mt-0.5 text-blue-500">{note.icon}</span>
                    {note.text}
                  </li>
                ))}
              </ul>
            </div>
          </FadeInView>

          <FadeInView delay={0.15}>
            <Card variant="artistic" className="shadow-none">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="author"
                      label="이름"
                      error={errors.author?.message}
                    >
                      <Input
                        id="author"
                        placeholder="홍길동"
                        maxLength={50}
                        autoComplete="name"
                        aria-invalid={Boolean(errors.author)}
                        {...register('author')}
                      />
                    </Field>
                    <Field
                      id="authorEmail"
                      label="이메일"
                      error={errors.authorEmail?.message}
                    >
                      <Input
                        id="authorEmail"
                        type="email"
                        placeholder="you@example.com"
                        maxLength={254}
                        autoComplete="email"
                        aria-invalid={Boolean(errors.authorEmail)}
                        {...register('authorEmail')}
                      />
                    </Field>
                  </div>

                  <Field id="title" label="제목" error={errors.title?.message}>
                    <Input
                      id="title"
                      placeholder="[문의/건의] 제목"
                      maxLength={120}
                      aria-invalid={Boolean(errors.title)}
                      {...register('title')}
                    />
                  </Field>

                  <Field
                    id="content"
                    label="내용"
                    error={errors.content?.message}
                  >
                    <Textarea
                      id="content"
                      placeholder="문의하실 내용을 자유롭게 적어주세요."
                      maxLength={5000}
                      aria-invalid={Boolean(errors.content)}
                      className="min-h-[160px] resize-none [field-sizing:fixed]"
                      {...register('content')}
                    />
                  </Field>

                  {/* honeypot: 사용자에겐 보이지 않고 봇만 채우는 필드 */}
                  <input
                    {...register('website')}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden
                    className="hidden"
                  />

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isPending ? '보내는 중...' : '문의 보내기'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
