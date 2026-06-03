'use client';

import React from 'react';
import { layers } from './layers';
import { spacing, radii, fontSizes, slotSize } from './theme';
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: radii.md,
          border: '1px solid rgba(74,46,29,0.6)',
        }}
      >
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => onSlotClick?.(slot)}
            className="flex items-center justify-center relative transition-all active:scale-95"
            style={{
              width: size,
              height: size,
              borderRadius: radii.sm,
              backgroundColor: slot.active
                ? 'rgba(241, 196, 15, 0.25)'
                : 'rgba(0,0,0,0.4)',
              border: slot.active
                ? '2px solid #F1C40F'
                : '1px solid rgba(74,46,29,0.5)',
              color: slot.active ? '#F1C40F' : 'rgba(255,255,255,0.6)',
              cursor: onSlotClick ? 'pointer' : 'default',
            }}
          >
            {slot.label ? (
              <span
                className="font-bold leading-none truncate px-0.5"
                style={{ fontSize: fontSizes.xxs }}
              >
                {slot.label}
              </span>
            ) : (
              <span className="text-[10px] opacity-30">-</span>
            )}
            {slot.keybind && (
              <span
                className="absolute bottom-0.5 right-1 font-bold"
                style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}
              >
                {slot.keybind}
              </span>
            )}
            {slot.cooldown !== undefined && slot.cooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-sm"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  fontSize: fontSizes.xxs,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {slot.cooldown.toFixed(1)}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
