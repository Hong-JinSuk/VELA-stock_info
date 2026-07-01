import type { KeyboardEvent, RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

type UseTypeaheadNavOptions<T> = {
  // 현재 표시 중인 자동완성 항목들 (순서대로 위/아래 이동).
  items: T[];
  // 항목 선택(Enter 또는 클릭) 시 실행.
  onSelect: (item: T) => void;
  // 드롭다운이 열려 있는지. 닫혀 있으면 키 이동을 처리하지 않는다.
  isOpen: boolean;
  // Escape로 드롭다운을 닫을 때 실행(선택).
  onClose?: () => void;
  // 스크롤 컨테이너 ref(선택). 넘기면 강조 항목이 화면 밖으로 나갈 때 자동 스크롤.
  // 컨테이너 안의 각 항목 요소에 `data-typeahead-item` 속성을 붙여야 한다.
  listRef?: RefObject<HTMLElement | null>;
};

// 검색 자동완성 드롭다운의 키보드 네비게이션(↑/↓ 이동, Enter 선택, Esc 닫기).
// 모든 검색창이 동일하게 동작하도록 공용화 — 종목찾기/13F/섹터 관리 등에서 재사용.
// 입력값이 바뀌어 목록이 갱신되면 호출 측에서 reset()으로 highlight를 초기화한다.
export function useTypeaheadNav<T>({
  items,
  onSelect,
  isOpen,
  onClose,
  listRef,
}: UseTypeaheadNavOptions<T>) {
  const [highlight, setHighlight] = useState(-1);

  const reset = useCallback(() => setHighlight(-1), []);

  // 강조 항목이 스크롤 영역 밖이면 보이도록 따라 스크롤(block: 'nearest' → 최소 이동).
  useEffect(() => {
    if (highlight < 0 || !listRef?.current) return;
    const el = listRef.current.querySelectorAll<HTMLElement>(
      '[data-typeahead-item]',
    )[highlight];
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, listRef]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || items.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // wrap 없이 최하단에서 멈춘다 (-1 → 0 → … → 마지막 항목에서 정지).
        setHighlight((h) => Math.min(h + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // wrap 없이 최상단(첫 항목)에서 멈춘다.
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        // 강조된 항목이 있을 때만 가로채서 선택. 없으면 폼 submit 등 기본 동작을 막지 않는다.
        if (highlight >= 0 && items[highlight] !== undefined) {
          e.preventDefault();
          onSelect(items[highlight]);
          setHighlight(-1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        setHighlight(-1);
      }
    },
    [isOpen, items, highlight, onSelect, onClose],
  );

  return { highlight, setHighlight, onKeyDown, reset };
}
