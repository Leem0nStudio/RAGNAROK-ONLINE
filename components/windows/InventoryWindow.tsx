'use client';

import React from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { InventoryPanel } from '@/components/InventoryPanel';

export function InventoryWindow() {
  const wm = useWindowManager();
  const WID: WindowId = 'inventory';

  return (
    <BaseWindow
      title="Inventario"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width={500}
      height="80vh"
      className="max-w-lg"
    >
      <InventoryPanel />
    </BaseWindow>
  );
}
