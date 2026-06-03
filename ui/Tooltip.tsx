'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOTION } from './motions';
import { layers } from './layers';
import { colors, radii, fontSizes, spacing } from './theme';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, position = 'top', delay = 300, children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const show = () => {
    timer = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timer) clearTimeout(timer);
    setVisible(false);
  };

  const positionStyles: Record<TooltipPosition, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  };

  return (
    <div
      className={`relative inline-flex pointer-events-auto ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={() => {
        if (timer) clearTimeout(timer);
        setVisible(v => !v);
      }}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute pointer-events-none whitespace-nowrap z-50"
            style={{
              ...positionStyles[position],
              padding: `${spacing.xs}px ${spacing.sm}px`,
              backgroundColor: colors.overlayHeavy,
              borderRadius: radii.sm,
              border: `1px solid ${colors.bronze}`,
              zIndex: layers.tooltips,
            }}
            variants={MOTION.tooltip.variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={MOTION.tooltip.transition}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
