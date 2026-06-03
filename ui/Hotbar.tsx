'use client';

import React, { useState } from 'react';
import { layers } from './layers';
import { colors, spacing, radii, fontSizes, slotSize } from './theme';
import { useResponsive } from './responsive';

export type HotbarSlot = {
  id: string;
  icon?: string;
  label?: string;
  cooldown?: number;
  active?: boolean;
  keybind?: string;
};

interface HotbarProps {
  slots: HotbarSlot[];
  columns?: number;
  onSlotClick?: (slot: HotbarSlot) => void;
}

export function Hotbar({ slots, columns = 6, onSlotClick }: HotbarProps) {
  const { isMobileView } = useResponsive();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const size = isMobileView ? slotSize.sm : slotSize.md;
  const gap = isMobileView ? 3 : spacing.xs;

  return (
    <div
      className="flex items-center justify-center"
      style={{ zIndex: layers.hud }}
    >
      <div
        className="flex flex-wrap justify-center"
        style={{
          gap,
          maxWidth: columns * (size + gap) + gap,
          padding: spacing.xs,
          backgroundColor: colors.glassDark,
          borderRadius: radii.md,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        {slots.map((slot, index) => {
          const isDisabled = !onSlotClick;
          const isHovered = hoveredIndex === index && !isDisabled;
          return (
          <button
            key={slot.id}
            onClick={() => onSlotClick?.(slot)}
            disabled={isDisabled}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex items-center justify-center relative transition-all active:scale-95"
            style={{
              width: size,
              height: size,
              borderRadius: radii.sm,
              backgroundColor: slot.active
                ? colors.goldBg
                : isHovered
                  ? colors.overlayLight
                  : colors.overlayMedium,
              border: slot.active
                ? `2px solid ${colors.gold}`
                : `1px solid ${colors.borderLight}`,
              color: slot.active ? colors.gold : colors.textWhiteDim,
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              filter: isHovered ? 'brightness(1.2)' : undefined,
            }}
          >
            {slot.label ? (
              <span
                className="font-bold leading-none truncate px-0.5"
                style={{ fontSize: fontSizes.secondary }}
              >
                {slot.label}
              </span>
            ) : (
              <span className="opacity-30" style={{ fontSize: fontSizes.secondary }}>-</span>
            )}
            {slot.keybind && (
              <span
                className="absolute bottom-0.5 right-1 font-bold"
                style={{ fontSize: fontSizes.secondary, color: colors.textWhiteFaint }}
              >
                {slot.keybind}
              </span>
            )}
            {slot.cooldown !== undefined && slot.cooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-sm"
                style={{
                  backgroundColor: colors.glassDark,
                  fontSize: fontSizes.secondary,
                  fontWeight: 700,
                  color: colors.textWhite,
                }}
              >
                {slot.cooldown.toFixed(1)}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}
