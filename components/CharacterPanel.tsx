'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { PlayerStatus } from '@/lib/game/types';
import { User } from 'lucide-react';
import { ExperienceBars } from '@/components/ExperienceBars';
import { colors, radii, fontSizes, spacing, hudOpacity } from '@/ui/theme';
import { getStatusBorderColor, getStatusNamePrefix, StatusBadge } from '@/components/PlayerStatusIndicator';

const MiniBar = ({
  current,
  max,
  color,
}: {
  current: number;
  max: number;
  color: string;
}) => {
  const percent = max > 0 ? (current / max) * 100 : 0;
  return (
    <div
      className="flex-1 overflow-hidden"
      style={{
        height: 6,
        backgroundColor: colors.bgDark,
        borderRadius: radii.full,
      }}
    >
      <div
        className="h-full transition-all duration-300"
        style={{
          width: `${percent}%`,
          backgroundColor: color,
          borderRadius: radii.full,
        }}
      />
    </div>
  );
};

const BAR_COLORS: Record<PlayerStatus, { hp: string; sp: string }> = {
  normal: { hp: colors.hp, sp: colors.sp },
  combat: { hp: colors.hp, sp: colors.sp },
  casting: { hp: colors.hp, sp: 'var(--ui-accent-indigo)' },
  dead: { hp: colors.textMuted, sp: colors.textMuted },
  stunned: { hp: colors.hp, sp: colors.sp },
  poisoned: { hp: 'var(--ui-accent-green)', sp: colors.sp },
  buffed: { hp: colors.hp, sp: colors.sp },
};

const PULSING_STATUSES: PlayerStatus[] = ['combat', 'casting'];

export function CharacterPanel() {
  const { jobClass, stats, currentHp, currentSp, playerStatus } = useGameStore();
  const playerName = "Adventurer";

  const borderColor = useMemo(() => getStatusBorderColor(playerStatus), [playerStatus]);
  const namePrefix = useMemo(() => getStatusNamePrefix(playerStatus), [playerStatus]);
  const barColors = BAR_COLORS[playerStatus];
  const isPulsing = PULSING_STATUSES.includes(playerStatus);
  const isDead = playerStatus === 'dead';

  return (
    <motion.div
      className="overflow-hidden font-sans"
      style={{
        maxWidth: 200,
        backgroundColor: isDead ? colors.glassDark : colors.parchment,
        borderRadius: radii.sm,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 1px 2px ${colors.overlayLight}`,
        opacity: isDead ? 0.6 : 1,
      }}
      animate={isPulsing ? {
        borderColor: [borderColor, 'var(--ui-gold)', borderColor],
      } : undefined}
      transition={isPulsing ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    >
      <div className="flex items-center gap-1.5" style={{ padding: spacing.xs }}>
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            backgroundColor: isDead ? colors.textMuted : colors.darkBrown,
            borderRadius: radii.sm,
            border: `1px solid ${isDead ? colors.textMuted : colors.bronze}`,
          }}
        >
          <User size={18} style={{ color: isDead ? colors.textMuted : colors.parchment }} />
        </div>

        {/* Important: name/level/job */}
        <div className="flex-1 min-w-0" style={{ marginTop: -1, opacity: isDead ? hudOpacity.dead : hudOpacity.primary }}>
          <div className="flex items-baseline justify-between gap-0.5">
            <p
              className="font-bold truncate leading-tight"
              style={{
                fontSize: fontSizes.name,
                color: isDead ? colors.textMuted : colors.textPrimary,
              }}
            >
              {namePrefix && <span style={{ marginRight: 2 }}>{namePrefix}</span>}
              {playerName}
            </p>
            <span
              className="whitespace-nowrap leading-tight font-mono font-bold"
              style={{
                fontSize: fontSizes.secondary,
                color: isDead ? colors.textMuted : colors.textSecondary,
              }}
            >
              Lv.{stats.level}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-0.5" style={{ marginTop: -0.5 }}>
            <p
              className="truncate leading-tight"
              style={{
                fontSize: fontSizes.secondary,
                color: isDead ? colors.textMuted : colors.textSecondary,
              }}
            >
              {jobClass}
            </p>
            <span
              className="whitespace-nowrap leading-tight font-mono"
              style={{
                fontSize: fontSizes.secondary,
                color: isDead ? colors.textMuted : colors.textMuted,
              }}
            >
              J{stats.jobLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Critical: HP/SP — 100% opacity */}
      <div style={{ padding: `0 ${spacing.xs}px ${spacing.xs}px`, opacity: isDead ? 0.5 : 1 }}>
        <div className="flex items-center gap-1">
          <span className="font-bold leading-none shrink-0" style={{ fontSize: fontSizes.secondary, color: barColors.hp }}>
            HP
          </span>
          <MiniBar current={currentHp} max={stats.maxHp} color={barColors.hp} />
          <span className="font-mono leading-none whitespace-nowrap shrink-0" style={{ fontSize: fontSizes.secondary, color: isDead ? colors.textMuted : colors.textSecondary }}>
            {Math.round(currentHp)}
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ marginTop: 1 }}>
          <span className="font-bold leading-none shrink-0" style={{ fontSize: fontSizes.secondary, color: barColors.sp }}>
            SP
          </span>
          <MiniBar current={currentSp} max={stats.maxSp} color={barColors.sp} />
          <span className="font-mono leading-none whitespace-nowrap shrink-0" style={{ fontSize: fontSizes.secondary, color: isDead ? colors.textMuted : colors.textSecondary }}>
            {Math.round(currentSp)}
          </span>
        </div>

        {/* Optional: EXP bars */}
        <div style={{ marginTop: 1, opacity: isDead ? hudOpacity.dead : hudOpacity.tertiary }}>
          <ExperienceBars />
        </div>

        {/* Status badge */}
        <div style={{ marginTop: 3, display: 'flex', justifyContent: 'center' }}>
          <StatusBadge status={playerStatus} />
        </div>
      </div>
    </motion.div>
  );
}
