import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, delay = 600) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);
  const startPos = useRef(null);

  const start = useCallback((e) => {
    firedRef.current = false;
    const touch = e.touches?.[0];
    startPos.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback((e) => {
    if (!startPos.current) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    // Cancel if finger moved more than 8px (scroll intent)
    if (dx > 8 || dy > 8) cancel();
  }, [cancel]);

  const click = useCallback((e) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onTouchMove: move,
    onClick: click,
  };
}
