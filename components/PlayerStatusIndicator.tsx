'use client';

import React from 'react';
import { motion } from 'motion/react';
import { PlayerStatus } from '@/lib/game/types';
import { colors, fontSizes, radii, spacing } from '@/ui/theme';

const STATUS_CONFIG: Record<PlayerStatus, {
  icon: string;
  label: string;
  border: string;
  bg: string;
  text: string;
  pulse?: boolean;
}> = {
  normal: {
    icon: '', label: '', border: colors.darkBrown,
    bg: '', text: '',
  },
  combat: {
    icon: '⚔️', label: 'COMBATE', border: 'var(--ui-accent-red)',
    bg: 'var(--ui-accent-red-bg)', text: colors.textWhite, pulse: true,
  },
  casting: {
    icon: '✨', label: 'CANALIZANDO', border: 'var(--ui-accent-indigo)',
    bg: 'var(--ui-accent-indigo-bg)', text: colors.textWhite, pulse: true,
  },
  dead: {
    icon: '💀', label: 'MUERTO', border: colors.textMuted,
    bg: colors.overlayDark, text: colors.textMuted,
  },
  stunned: {
    icon: '⚡', label: 'ATURDIDO', border: 'var(--ui-accent-amber)',
    bg: 'var(--ui-accent-amber-bg)', text: colors.textPrimary,
  },
  poisoned: {
    icon: '☠️', label: 'ENVENENADO', border: 'var(--ui-accent-green)',
    bg: 'var(--ui-accent-green-bg)', text: colors.textWhite,
  },
  buffed: {
    icon: '✨', label: 'BUFFS ACTIVOS', border: 'var(--ui-gold)',
    bg: 'var(--ui-gold-bg)', text: colors.textPrimary,
  },
};

export function getStatusBorderColor(status: PlayerStatus): string {
  return STATUS_CONFIG[status].border || colors.darkBrown;
}

export function getStatusNamePrefix(status: PlayerStatus): string {
  return STATUS_CONFIG[status].icon || '';
}

interface StatusBadgeProps {
  status: PlayerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'normal') return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: `1px ${spacing.sm}px`,
        backgroundColor: cfg.bg,
        borderRadius: radii.sm,
        border: `1px solid ${cfg.border}`,
        opacity: status === 'dead' ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 11, lineHeight: '14px' }}>{cfg.icon}</span>
      <span
        className="font-bold font-sans leading-tight"
        style={{
          fontSize: fontSizes.secondary,
          color: cfg.text,
          letterSpacing: '0.5px',
        }}
      >
        {cfg.label}
      </span>
    </motion.div>
  );
}
