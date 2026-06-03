'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { colors, radii, spacing } from '@/ui/theme';

export function AccessibilityControls() {
  const { highContrastMode, toggleHighContrastMode } = useGameStore((state) => ({
    highContrastMode: state.highContrastMode,
    toggleHighContrastMode: state.toggleHighContrastMode,
  }));

  return (
    <div style={{ position: 'fixed', bottom: spacing.md, right: spacing.md, zIndex: 1000 }}>
      <button
        onClick={toggleHighContrastMode}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          backgroundColor: highContrastMode ? colors.accentGreen : colors.glassDark,
          color: colors.textWhite,
          border: `1px solid ${colors.borderGray}`,
          borderRadius: radii.md,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {highContrastMode ? 'Modo Contraste: ON' : 'Modo Contraste: OFF'}
      </button>
    </div>
  );
}
