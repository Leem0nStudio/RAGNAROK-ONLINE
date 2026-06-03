'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDragWindowOptions {
  initialPosition?: { x: number; y: number };
  bounds?: boolean;
}

export function useDragWindow({ initialPosition, bounds = true }: UseDragWindowOptions = {}) {
  const [pos, setPos] = useState(initialPosition ?? { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = nodeRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const current = posRef.current;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: current.x,
      origY: current.y,
    };
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    let newX = dragRef.current.origX + dx;
    let newY = dragRef.current.origY + dy;

    if (bounds) {
      const el = nodeRef.current;
      if (el) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const r = el.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, vw - r.width));
        newY = Math.max(0, Math.min(newY, vh - r.height));
      }
    }

    setPos({ x: newX, y: newY });
  }, [bounds]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = nodeRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const resetPosition = useCallback(() => {
    setPos(initialPosition ?? { x: 0, y: 0 });
  }, [initialPosition]);

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };

  return { pos, isDragging, nodeRef, dragHandlers, resetPosition };
}
