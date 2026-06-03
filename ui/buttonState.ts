'use client';

import { useState, useCallback } from 'react';

export function useButtonState(opts?: { disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => {
    if (!opts?.disabled) setHovered(true);
  }, [opts?.disabled]);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  return { hovered, onMouseEnter, onMouseLeave };
}
