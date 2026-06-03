'use client';

import React from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { ShoppingBag } from 'lucide-react';
import { colors, fontSizes, spacing } from '@/ui/theme';

export function ShopWindow() {
  const wm = useWindowManager();
  const WID: WindowId = 'shop';

  return (
    <BaseWindow
      title="Tienda"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width="min(400px, calc(100vw - 48px))"
      height="auto"
    >
      <div className="text-center py-12" style={{ padding: spacing.xl, color: colors.textMuted }}>
        <ShoppingBag size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
        <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: fontSizes.normal }}>
          Tienda del NPC
        </p>
        <p style={{ fontSize: fontSizes.secondary }}>
          Habla con un NPC comerciante para ver sus productos.
        </p>
      </div>
    </BaseWindow>
  );
}
