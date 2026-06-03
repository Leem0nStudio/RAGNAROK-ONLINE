'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { MOTION } from '@/ui/motions';
import { layers } from '@/ui/layers';
import { colors, radii, fontSizes, spacing, hudOpacity } from '@/ui/theme';

export function LootFeed() {
  const notifications = useGameStore(s => s.lootNotifications);

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: '50%',
        bottom: '30%',
        transform: 'translateX(-50%)',
        zIndex: layers.notifications,
      }}
    >
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            variants={MOTION.notification.variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={MOTION.notification.transition}
            className="font-sans pointer-events-auto"
            onClick={() => useGameStore.setState((s) => ({ lootNotifications: s.lootNotifications.filter(x => x.id !== n.id) }))}
            style={{ cursor: 'pointer',
              padding: `${spacing.sm}px ${spacing.md}px`,
              marginBottom: spacing.sm,
              backgroundColor: colors.overlayHeavy,
              borderRadius: radii.md,
              border: `1px solid ${colors.bronze}`,
              borderLeft: `3px solid ${colors.gold}`,
              textAlign: 'center',
              opacity: hudOpacity.critical,
            }}
          >
            {n.lines.map((line, i) => (
              <p
                key={i}
                className={`leading-tight whitespace-nowrap ${line.startsWith('+') ? 'font-mono font-bold' : ''}`}
                style={{
                  fontSize: fontSizes.normal,
                  color: line.startsWith('+') ? colors.gold : colors.textWhite,
                }}
              >
                {line}
              </p>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
