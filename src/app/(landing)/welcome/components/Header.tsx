import { VelaLogo } from '@/components/common/VelaLogo2';
import { Moon, Sun } from 'lucide-react';
import { navLinks } from '../navigation';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function Header({ isDarkMode, toggleTheme }: HeaderProps) {
  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-black/10 dark:border-white/10 bg-[#F8FAFC]/80 dark:bg-[#0F1115]/80 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VelaLogo size={42} className="text-slate-900 dark:text-white" />
          <div className="w-px h-10 bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex flex-col gap-[2px]">
            <span className="font-['Sora'] font-medium tracking-[0.24em] text-xl leading-none text-slate-900 dark:text-white">
              VELA
            </span>
            <span className="font-['DM_Sans'] font-normal tracking-[0.32em] text-[10px] leading-none text-slate-600 dark:text-slate-400">
              MARKET &nbsp; INTELLIGENCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleScroll(e, link.id)}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
