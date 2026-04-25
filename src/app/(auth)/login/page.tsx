import { HeroVisual } from '@/app/(landing)/welcome/components/Hero';
import VelaText from '@/components/common/VelaText';
import { LoginForm } from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col overflow-hidden max-h-svh">
      <div className="max-w-[1440px] px-8 min-h-20 flex">
        <VelaText />
      </div>
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
