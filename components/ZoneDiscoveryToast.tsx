'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { MOTION } from '@/ui/motions';
import { layers } from '@/ui/layers';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

export function ZoneDiscoveryToast() {
  const mapTransitionBanner = useGameStore(s => s.mapTransitionBanner);
  const hideMapTransitionBanner = useGameStore(s => s.hideMapTransitionBanner);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mapTransitionBanner) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideMapTransitionBanner();
      }, 2000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mapTransitionBanner, hideMapTransitionBanner]);

  const parts = mapTransitionBanner ? mapTransitionBanner.split('—').map(s => s.trim()) : [];
  const zoneName = parts[0] || '';
  const subzoneName = parts[1] || '';

  return (
    <AnimatePresence>
      {mapTransitionBanner && (
        <motion.div
          key={mapTransitionBanner}
          variants={MOTION.notification.variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={MOTION.notification.transition}
          className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: layers.notifications }}
        >
          <div
            className="text-center font-sans"
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              backgroundColor: colors.overlayHeavy,
              borderRadius: radii.md,
              border: `1px solid ${colors.bronze}`,
            }}
          >
            <p
              className="font-bold leading-tight"
              style={{ fontSize: fontSizes.normal, color: colors.textWhite }}
            >
              {zoneName}
            </p>
            {subzoneName && (
              <p
                className="leading-tight mt-0.5"
                style={{ fontSize: fontSizes.secondary, color: colors.gold }}
              >
                {subzoneName}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
