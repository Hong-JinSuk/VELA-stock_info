'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import DotLoader from '@/components/common/DotLoader';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { loginSchema, LoginSchema } from '@/schemas/login-schema';
import { signIn, signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const { data: session } = useSession();
  const runPromiseTest = (isSuccess: boolean) => {
    // 1. 2초 뒤에 결과가 나오는 가짜 비동기 작업
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (isSuccess) resolve({ name: 'Stock Info' });
        else reject(new Error('에러 발생'));
      }, 2000);
    });

    // 2. 토스트 실행
    toast.promise(promise, {
      loading: (
        <div className="flex gap-x-2 items-center">
          <span>로그인 중입니다</span>{' '}
          <DotLoader className="text-violet-500 self-end" />
        </div>
      ),
      success: (data: any) => {
        return `${data.name} 서비스에 접속되었습니다!`; // 성공 시 초록색(emerald-100)
      },
      error: (err) => {
        return `문제가 발생했습니다: ${err.message}`; // 실패 시 빨간색(rose-100)
      },
    });
  };

  // 1. Hook Form 초기화
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2. 제출 핸들러
  const onSubmit = async (data: LoginSchema) => {
    try {
      console.log('서버 전송 데이터:', data);

      // API 호출 시뮬레이션 (1초 대기)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runPromiseTest(true);
      // 초기화하지 않고 그대로 둠 (성공 후 로직은 필요시 여기에 추가)
    } catch (error) {
      console.error('로그인 에러:', error);
    }
  };

  if (session) {
    console.log('session : ', session);
    // session이 있다면 곧바로 메인 페이지로 보내야함.
  }

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)} // handleSubmit이 Zod 검증 후 onSubmit을 실행합니다.
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>

        {/* Email 필드 */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="mail@example.com"
            {...register('email')} // React Hook Form 연결
            className={cn(
              errors.email && 'border-red-500 focus-visible:ring-red-500',
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </Field>

        {/* Password 필드 */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            {...register('password')} // React Hook Form 연결
            className={cn(
              errors.password && 'border-red-500 focus-visible:ring-red-500',
            )}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
          {session && (
            <Button onClick={() => signOut()} type="button" className="w-full">
              LogOut
            </Button>
          )}
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            onClick={() => signIn('google')}
            variant="outline"
            type="button"
            className="w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="100"
              height="100"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              ></path>
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              ></path>
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
            </svg>
            Login with Google
          </Button>
          <Button
            onClick={() => signIn('github')}
            variant="outline"
            type="button"
            title="현재 준비 중인 서비스입니다."
            className="w-full flex items-center"
            disabled
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
            </svg>
            {`Login with GitHub / preparing soon!`}
          </Button>
          <FieldDescription className="text-center mt-4">
            {`Don't have an account?`}
            <a href="#" className="underline underline-offset-4 ml-1">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
