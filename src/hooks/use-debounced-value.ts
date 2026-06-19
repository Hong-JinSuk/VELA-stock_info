import { useEffect, useState } from 'react';

// 값이 delay(ms) 동안 변하지 않으면 그제서야 반영되는 디바운스 훅.
// 검색 입력처럼 매 타이핑마다 필터/요청을 돌리지 않으려는 곳에서 공용으로 사용.
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
