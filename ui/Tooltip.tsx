'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOTION } from './motions';
import { layers } from './layers';
import { colors, radii, fontSizes, spacing } from './theme';
import { getRarityStyles, Rarity } from './rarity';

type TooltipPosition = 'top' | 'bottom';

interface TooltipProps {
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, position = 'bottom', delay = 200, children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  const positionStyles: Record<TooltipPosition, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
  };

  return (
    <div
      className={`relative inline-flex pointer-events-auto ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute pointer-events-none z-50"
            style={{
              ...positionStyles[position],
              padding: `${spacing.xs}px ${spacing.sm}px`,
              backgroundColor: colors.overlayHeavy,
              borderRadius: radii.sm,
              border: `1px solid ${colors.bronze}`,
              zIndex: layers.tooltips,
              minWidth: 100,
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

interface TooltipContentProps {
  name: string;
  rarity?: Rarity;
  desc?: string;
  stats?: string;
}

export function TooltipContent({ name, rarity, desc, stats }: TooltipContentProps) {
  const rarityStyle = rarity ? getRarityStyles(rarity) : null;

  return (
    <div className="font-sans" style={{ maxWidth: 200 }}>
      {/* Header: name + rarity badge */}
      <div
        className="flex items-center justify-between gap-2"
        style={{
          borderBottom: rarityStyle ? `1px solid ${rarityStyle.border}` : undefined,
          paddingBottom: desc || stats ? 3 : 0,
          marginBottom: desc || stats ? 3 : 0,
        }}
      >
        <span
          className="font-bold truncate leading-tight"
          style={{
            fontSize: fontSizes.normal,
            color: rarityStyle?.color ?? colors.textWhite,
          }}
        >
          {name}
        </span>
        {rarity && (
          <span
            className="shrink-0 font-bold font-sans leading-tight"
            style={{
              fontSize: fontSizes.secondary,
              color: rarityStyle!.color,
              backgroundColor: rarityStyle!.badge,
              padding: '0 4px',
              borderRadius: radii.sm,
              letterSpacing: '0.3px',
            }}
          >
            {rarity.toUpperCase()}
          </span>
        )}
      </div>

      {/* Description */}
      {desc && (
        <p
          className="leading-tight"
          style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
        >
          {desc}
        </p>
      )}

      {/* Stats */}
      {stats && (
        <p
          className="font-mono leading-tight"
          style={{
            fontSize: fontSizes.secondary,
            color: colors.gold,
            marginTop: desc ? 2 : 0,
          }}
        >
          {stats}
        </p>
      )}
    </div>
  );
}
