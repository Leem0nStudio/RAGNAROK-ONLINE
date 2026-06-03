'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { layers } from '@/ui/layers';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

const MAX_QUESTS = 3;

export function QuestTracker() {
  const activeQuests = useGameStore((s) => s.activeQuests);
  const quests = useGameStore((s) => s.quests);
  const questProgress = useGameStore((s) => s.questProgress);

  const activeQuestDefs = quests.filter((q) => activeQuests.includes(q.id));
  const visible = activeQuestDefs.slice(0, MAX_QUESTS);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none font-sans"
      style={{
        top: 'calc(var(--hud-gap-top, 12px) + 32px)',
        right: 'var(--hud-gap-right, 12px)',
        zIndex: layers.hud,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 200,
      }}
    >
      {visible.map((quest) => {
        const progress = questProgress[quest.id];
        const firstObj = quest.objectives?.[0];
        const objProgress = progress?.[0];
        const done = objProgress ? objProgress.current >= objProgress.count : false;

        return (
          <div
            key={quest.id}
            style={{
              padding: `${spacing.xs}px ${spacing.sm}px`,
              borderRadius: radii.sm,
              backgroundColor: colors.overlayDarker,
              border: `1px solid ${colors.borderLight}`,
              opacity: 0.85,
            }}
          >
            <p
              className="font-bold truncate leading-tight"
              style={{ fontSize: fontSizes.secondary, color: colors.textGold }}
            >
              {quest.name}
            </p>
            {firstObj && (
              <p
                className="font-mono leading-tight"
                style={{
                  fontSize: fontSizes.secondary,
                  color: done ? colors.accentGreen : colors.textWhiteDim,
                }}
              >
                {objProgress ? `${objProgress.current}/${objProgress.count}` : `${firstObj.current}/${firstObj.count}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
