import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

export const ThemeToggleButton = () => {
  // next-themes에서 제공하는 기본 훅을 사용합니다.
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    // 현재 테마의 반대 값을 결정
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // 1. View Transitions 미지원 브라우저 대응
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // 2. 애니메이션과 함께 테마 전환
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

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
