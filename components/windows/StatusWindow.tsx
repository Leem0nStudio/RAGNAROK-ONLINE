'use client';

import React from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { StatusPanel } from '@/components/StatusPanel';

export function StatusWindow() {
  const wm = useWindowManager();
  const WID: WindowId = 'status';

  return (
    <BaseWindow
      title="Estadísticas"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width={520}
      height="85vh"
      className="max-w-xl"
    >
      <StatusPanel />
    </BaseWindow>
  );
}
