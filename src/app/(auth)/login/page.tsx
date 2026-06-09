'use client';

import HeroVisual from '@/app/(welcome)/welcome/components/hero-visual';
import VelaText from '@/components/common/vela-text';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from '../components/login-form';

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/overview');
    }
  }, [session, router]);

  return (
    <div className="flex flex-col overflow-hidden max-h-svh">
      <div className="w-full mx-auto lg:max-w-[1440px] px-8 min-h-20 flex">
        <VelaText />
      </div>
      <Separator className="bg-black/10 dark:bg-white/10" />
      <div className="grid lg:grid-cols-2 h-screen">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block bg-blue-200">
          <HeroVisual />
        </div>
      </div>
    </div>
  );
}
