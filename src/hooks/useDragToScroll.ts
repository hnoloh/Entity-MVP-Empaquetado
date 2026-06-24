import { useState, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';

export function useDragToScroll<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  onMouseDown: (e: MouseEvent) => void;
  onMouseLeave: () => void;
  onMouseUp: () => void;
  onMouseMove: (e: MouseEvent) => void;
  isDragging: boolean;
  hasDragged: boolean;
} {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX);
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    isDragging,
    hasDragged
  };
}
