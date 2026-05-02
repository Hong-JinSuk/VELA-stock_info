'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

interface ThemeToggleButtonProps {
  type?: 'toggle' | 'switch';
}

export const ThemeToggleButton = ({
  type = 'toggle',
}: ThemeToggleButtonProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  if (!mounted) {
    if (type === 'switch') {
      return <div className="h-6 w-11 rounded-full bg-muted" />;
    }
    return (
      <Button variant="link" size="icon" className="size-10">
        <div className="size-5.5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  if (type === 'switch') {
    return (
      <button
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
        `}
      >
        <span
          className={`
            pointer-events-none flex size-5 items-center justify-center rounded-full
            bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out
            ${isDark ? 'translate-x-5' : 'translate-x-0'}
          `}
        >
          {isDark ? (
            <Moon className="size-3 text-slate-700 fill-slate-700" />
          ) : (
            <Sun className="size-3 text-yellow-500 fill-yellow-400" />
          )}
        </span>
      </button>
    );
  }

  return (
    <Button variant="link" onClick={toggleTheme}>
      {isDark ? (
        <Sun className="size-5.5 text-yellow-500 fill-yellow-500" />
      ) : (
        <Moon className="size-5.5 text-gray-400 fill-gray-200" />
      )}
    </Button>
  );
};
