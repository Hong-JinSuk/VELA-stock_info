import { useEffect, useRef, useState } from 'react';

export function useTextClamp<T extends HTMLElement = HTMLParagraphElement>() {
  const ref = useRef<T>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setIsClamped(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isClamped };
}
