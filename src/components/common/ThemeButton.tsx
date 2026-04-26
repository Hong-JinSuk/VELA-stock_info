'use client'; // Next.js 클라이언트 컴포넌트 선언

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

export const ThemeToggleButton = () => {
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

  // 레이아웃이 깨지지 않게 빈 공간(Skeleton)만 보여줍니다.
  if (!mounted) {
    return (
      <Button variant={'link'} size="icon" className="size-10">
        <div className="size-5.5" />
      </Button>
    );
  }

  return (
    <Button variant={'link'} onClick={toggleTheme}>
      {theme === 'dark' ? (
        <Sun className="size-5.5 text-yellow-500" />
      ) : (
        <Moon className="size-5.5 text-slate-600" />
      )}
    </Button>
  );
};
