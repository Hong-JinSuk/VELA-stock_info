import { VelaLogo } from '@/components/common/VelaLogo';

export function Footer() {
  return (
    <footer className="py-12 border-t border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0F1115]">
      <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <VelaLogo size={24} className="text-slate-900 dark:text-white" />
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex flex-col gap-[2px]">
            <span className="font-['Sora'] font-medium tracking-[0.24em] text-sm leading-none text-slate-900 dark:text-white">
              VELA
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} VELA Market Intelligence. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
