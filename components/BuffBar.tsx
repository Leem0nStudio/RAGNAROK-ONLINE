'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import type { ActiveBuff } from '@/lib/game/state';
import type { StatusEffect } from '@/lib/game/types';
import { MOTION } from '@/ui/motions';
import { layers } from '@/ui/layers';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

const MAX_BUFFS = 16;

const DEBUFF_ICONS: Record<string, string> = {
  haste: '◈',
  might: '▲',
  burn: '◆',
  slow: '▼',
  vulnerability: '◇',
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function getDebuffIcon(type: string): string {
  return DEBUFF_ICONS[type] || '↓';
}

function getDebuffDescription(type: string): string {
  switch (type) {
    case 'haste': return 'Velocidad de ataque reducida';
    case 'might': return 'Ataque reducido';
    case 'burn': return 'Daño continuo de fuego';
    case 'slow': return 'Velocidad de movimiento reducida';
    case 'vulnerability': return 'Defensa reducida';
    default: return type;
  }
}

type BuffSlot = ActiveBuff | (StatusEffect & { _isDebuff: true });

export function BuffBar() {
  const buffs = useGameStore((s) => s.activeBuffs);
  const debuffs = useGameStore((s) => s.activeStatusEffects);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visible = [...buffs, ...debuffs.map(d => ({ ...d, _isDebuff: true as const }))].slice(
    0,
    MAX_BUFFS,
  );

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        top: 'var(--hud-gap-top, 12px)',
        right: 'var(--hud-gap-right, 12px)',
        zIndex: layers.hud,
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.xs,
        justifyContent: 'flex-end',
        maxWidth: 'min(400px, calc(100vw - var(--hud-gap-left, 12px) - var(--hud-gap-right, 12px)))',
      }}
    >
      {visible.map((item) => {
        const isBuff = !('_isDebuff' in item);
        const id = item.id;
        const name = item.name;
        const isHovered = hoveredId === id;

        let icon: string;
        let durationMs: number;
        let maxDurationMs: number;
        let description: string;
        let stacks = 0;

        if (isBuff) {
          const b = item as ActiveBuff;
          icon = b.icon || '↑';
          durationMs = b.durationMs;
          maxDurationMs = b.maxDurationMs;
          description = b.description;
        } else {
          const d = item as StatusEffect & { _isDebuff: true };
          icon = getDebuffIcon(d.type);
          durationMs = d.remainingTime;
          maxDurationMs = d.duration;
          description = getDebuffDescription(d.type);
          stacks = d.stacks || 0;
        }

        return (
          <div
            key={id}
            className="pointer-events-auto relative"
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: radii.sm,
                backgroundColor: isBuff ? colors.accentGreenBg : colors.accentRedBg,
                border: `1px solid ${isBuff ? colors.accentGreen : colors.accentRed}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSizes.secondary,
                color: isBuff ? colors.accentGreenBright : colors.accentRed,
              }}
            >
              {icon}
            </div>

            {stacks > 1 && (
              <div
                className="absolute flex items-center justify-center font-bold leading-none"
                style={{
                  bottom: -3,
                  right: -3,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  padding: '0 2px',
                  backgroundColor: colors.accentAmber,
                  fontSize: 9,
                  color: colors.textWhite,
                }}
              >
                {stacks}
              </div>
            )}

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  key="tooltip"
                  className="absolute pointer-events-none whitespace-nowrap"
                  style={{
                    top: '100%',
                    right: 0,
                    marginTop: 4,
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
                  <p
                    className="font-bold leading-tight"
                    style={{ fontSize: fontSizes.normal, color: colors.textWhite }}
                  >
                    {name}
                  </p>
                  <p
                    className="font-mono leading-tight"
                    style={{ fontSize: fontSizes.secondary, color: colors.gold }}
                  >
                    {formatDuration(durationMs)}
                  </p>
                  <p
                    className="leading-tight"
                    style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                  >
                    {description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
