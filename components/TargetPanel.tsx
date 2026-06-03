'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { Swords, Crown, MessageCircle } from 'lucide-react';
import { colors, radii, spacing, fontSizes } from '@/ui/theme';

type FrameStyle = {
  border: string;
  bg: string;
  headerBg: string;
  accent: string;
  icon: React.ReactNode;
  typeLabel: string;
};

const MONSTER_FRAME: FrameStyle = {
  border: 'var(--ui-accent-red)',
  bg: colors.darkBrown,
  headerBg: 'var(--ui-accent-red-bg)',
  accent: colors.hp,
  icon: <Swords size={16} style={{ color: colors.hpSoft }} />,
  typeLabel: 'MONSTRUO',
};

const BOSS_FRAME: FrameStyle = {
  border: 'var(--ui-gold)',
  bg: '#1a1410',
  headerBg: 'var(--ui-gold-bg)',
  accent: colors.gold,
  icon: <Crown size={16} style={{ color: colors.gold }} />,
  typeLabel: '⭐ BOSS',
};

const NPC_FRAME: FrameStyle = {
  border: 'var(--ui-accent-blue)',
  bg: '#0f1720',
  headerBg: 'var(--ui-accent-indigo-bg)',
  accent: colors.accentBlue,
  icon: <MessageCircle size={16} style={{ color: colors.accentBlue }} />,
  typeLabel: 'NPC',
};

function getFrame(entityType: 'monster' | 'boss_mvp' | 'npc' | null): FrameStyle {
  if (entityType === 'boss_mvp') return BOSS_FRAME;
  if (entityType === 'npc') return NPC_FRAME;
  return MONSTER_FRAME;
}

export function TargetPanel() {
  const { targetEntityId, targetName, targetHp, targetMaxHp, targetLevel, targetEntityType } = useGameStore();
  const hpPercent = targetMaxHp > 0 ? (targetHp / targetMaxHp) * 100 : 0;
  const frame = getFrame(targetEntityType);
  const isBoss = targetEntityType === 'boss_mvp';

  const hpColor = hpPercent > 50
    ? colors.hp
    : hpPercent > 25
      ? 'var(--ui-accent-amber)'
      : colors.accentReddark;

  return (
    <AnimatePresence>
      {targetEntityId && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="font-sans"
          style={{
            maxWidth: 220,
            backgroundColor: frame.bg,
            borderRadius: radii.md,
            border: isBoss ? `2px solid ${frame.border}` : `1px solid ${frame.border}`,
            boxShadow: isBoss
              ? `0 0 8px ${frame.border}, 0 2px 6px ${colors.overlayDark}`
              : `0 2px 6px ${colors.overlayDark}`,
            overflow: 'hidden',
          }}
        >
          {/* Header: icon + name + level */}
          <div className="flex items-center justify-between" style={{
            padding: `${spacing.xs}px ${spacing.sm}px`,
            backgroundColor: frame.headerBg,
            borderBottom: `1px solid ${frame.border}`,
          }}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0">{frame.icon}</span>
              <span
                className="font-bold truncate"
                style={{
                  fontSize: fontSizes.normal,
                  color: isBoss ? colors.gold : colors.oldPaper,
                }}
              >
                {targetName}
              </span>
            </div>
            <span
              className="shrink-0 ml-1 font-bold font-mono"
              style={{
                fontSize: fontSizes.secondary,
                color: isBoss ? colors.gold : colors.textMuted,
                backgroundColor: isBoss ? '#2a2010' : colors.glassDark,
                padding: '0 4px',
                borderRadius: radii.sm,
                lineHeight: '16px',
              }}
            >
              Lv.{targetLevel}
            </span>
          </div>

          {/* Body: HP bar */}
          <div style={{ padding: `${spacing.xs}px ${spacing.sm}px ${spacing.xs}px` }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 2 }}>
              <span className="font-bold font-sans leading-none" style={{ fontSize: fontSizes.secondary, color: frame.accent }}>
                HP
              </span>
              <span className="font-mono leading-none" style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}>
                {targetHp}<span style={{ opacity: 0.5 }}>/{targetMaxHp}</span>
              </span>
            </div>
            <div
              className="overflow-hidden"
              style={{
                height: 6,
                backgroundColor: colors.glassDark,
                borderRadius: radii.sm,
                boxShadow: isBoss ? `inset 0 0 4px ${frame.border}` : undefined,
              }}
            >
              <motion.div
                animate={{ width: `${hpPercent}%` }}
                className="h-full"
                style={{
                  backgroundColor: hpColor,
                  borderRadius: radii.sm,
                  boxShadow: isBoss ? `0 0 4px ${hpColor}` : undefined,
                }}
              />
            </div>
          </div>

          {/* Footer: type label */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: `1px ${spacing.sm}px`,
              backgroundColor: isBoss ? '#2a2010' : colors.glassDark,
              borderTop: `1px solid ${frame.border}`,
            }}
          >
            <span
              className="font-bold font-sans leading-tight"
              style={{
                fontSize: fontSizes.secondary,
                color: frame.accent,
                letterSpacing: '0.3px',
              }}
            >
              {frame.typeLabel}
            </span>
            {targetEntityType === 'boss_mvp' && (
              <span style={{ fontSize: 10, color: colors.gold, lineHeight: '14px' }}>
                👑 MVP
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
