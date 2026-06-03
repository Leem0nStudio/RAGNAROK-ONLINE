'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { User } from 'lucide-react';
import { ExperienceBars } from '@/components/ExperienceBars';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

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
        backgroundColor: colors.bar.bgDark,
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

export function CharacterPanel() {
  const { jobClass, stats, currentHp, currentSp } = useGameStore();
  const playerName = "Adventurer";

  return (
    <div
      className="overflow-hidden font-serif"
      style={{
        maxWidth: 200,
        backgroundColor: colors.bg.parchment,
        borderRadius: radii.sm,
        border: `1px solid ${colors.border.darkBrown}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      }}
    >
      <div className="flex items-center gap-1.5" style={{ padding: 3 }}>
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.border.darkBrown,
            borderRadius: radii.sm,
            border: `1px solid ${colors.border.bronze}`,
          }}
        >
          <User size={18} style={{ color: colors.bg.parchment }} />
        </div>

        <div className="flex-1 min-w-0" style={{ marginTop: -1 }}>
          <div className="flex items-baseline justify-between gap-0.5">
            <p
              className="font-bold truncate leading-tight"
              style={{ fontSize: 9, color: colors.text.nearBlack }}
            >
              {playerName}
            </p>
            <span
              className="whitespace-nowrap leading-tight font-mono font-bold"
              style={{ fontSize: 8, color: colors.text.darkGray }}
            >
              Lv.{stats.level}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-0.5" style={{ marginTop: -0.5 }}>
            <p
              className="truncate leading-tight"
              style={{ fontSize: 8, color: colors.text.darkGray }}
            >
              {jobClass}
            </p>
            <span
              className="whitespace-nowrap leading-tight font-mono"
              style={{ fontSize: 8, color: colors.text.muted }}
            >
              J{stats.jobLevel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 3px 3px 3px' }}>
        <div className="flex items-center gap-1">
          <span className="font-bold leading-none shrink-0" style={{ fontSize: 7, color: colors.bar.hp }}>
            HP
          </span>
          <MiniBar current={currentHp} max={stats.maxHp} color={colors.bar.hp} />
          <span className="font-mono leading-none whitespace-nowrap shrink-0" style={{ fontSize: 7, color: colors.text.darkGray }}>
            {Math.round(currentHp)}
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ marginTop: 1 }}>
          <span className="font-bold leading-none shrink-0" style={{ fontSize: 7, color: colors.bar.sp }}>
            SP
          </span>
          <MiniBar current={currentSp} max={stats.maxSp} color={colors.bar.sp} />
          <span className="font-mono leading-none whitespace-nowrap shrink-0" style={{ fontSize: 7, color: colors.text.darkGray }}>
            {Math.round(currentSp)}
          </span>
        </div>

        <div style={{ marginTop: 1 }}>
          <ExperienceBars />
        </div>
      </div>
    </div>
  );
}
