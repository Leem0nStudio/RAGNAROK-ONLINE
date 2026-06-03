'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
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
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: layers.notifications }}
        >
          <div
            className="text-center font-serif"
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: radii.md,
              border: `1px solid ${colors.border.bronze}`,
            }}
          >
            <p
              className="font-bold leading-tight"
              style={{ fontSize: fontSizes.sm, color: colors.text.white }}
            >
              {zoneName}
            </p>
            {subzoneName && (
              <p
                className="leading-tight mt-0.5"
                style={{ fontSize: fontSizes.xxs, color: colors.bar.exp }}
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
