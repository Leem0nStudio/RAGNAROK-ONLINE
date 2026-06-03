'use client';

import React from 'react';
import { motion } from 'motion/react';
import { PlayerStatus } from '@/lib/game/types';
import { useGameStore } from '@/lib/game/state';
import { colors, fontSizes, radii, spacing } from '@/ui/theme';
import { highContrastColors } from '@/ui/accessibility';

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

interface PlayerStatusIndicatorProps {
  currentHp: number;
  maxHp: number;
  currentSp: number;
  maxSp: number;
}

export function PlayerStatusIndicator({ currentHp, maxHp, currentSp, maxSp }: PlayerStatusIndicatorProps) {
  const highContrastMode = useGameStore((state) => state.highContrastMode);

  const hpPercentage = (currentHp / maxHp) * 100;
  const spPercentage = (currentSp / maxSp) * 100;

  const hpColor = highContrastMode ? highContrastColors.hp : colors.hp;
  const hpBgColor = highContrastMode ? highContrastColors.hpBg : colors.hpBg;
  const spColor = highContrastMode ? highContrastColors.sp : colors.sp;
  const spBgColor = highContrastMode ? highContrastColors.spBg : colors.spBg;
  const textColor = highContrastMode ? highContrastColors.text : colors.textWhite;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          backgroundColor: hpBgColor,
          borderRadius: radii.sm,
          height: 20,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${hpPercentage}%` }}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: hpColor,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: spacing.sm,
          right: spacing.sm,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: textColor,
          fontSize: fontSizes.secondary,
          fontWeight: 'bold',
        }}>
          <span>HP</span>
          <span>{`${currentHp} / ${maxHp}`}</span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          backgroundColor: spBgColor,
          borderRadius: radii.sm,
          height: 20,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${spPercentage}%` }}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: spColor,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: spacing.sm,
          right: spacing.sm,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: textColor,
          fontSize: fontSizes.secondary,
          fontWeight: 'bold',
        }}>
          <span>SP</span>
          <span>{`${currentSp} / ${maxSp}`}</span>
        </div>
      </div>
    </div>
  );
}
