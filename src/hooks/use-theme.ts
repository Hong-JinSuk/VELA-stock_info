import { useEffect, useState } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 초기 테마 설정 (시스템 설정 반영 로직 등을 추가할 수 있음)
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    // 1. View Transitions 미지원 브라우저 대응
    if (!document.startViewTransition) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    // 2. 애니메이션과 함께 테마 전환
    document.startViewTransition(() => {
      setIsDarkMode((prev) => !prev);
    });
  };

  return { isDarkMode, toggleTheme };
};
