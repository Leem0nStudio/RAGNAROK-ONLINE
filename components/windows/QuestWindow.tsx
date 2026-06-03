'use client';

import React from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { QuestsPanel } from '@/components/QuestsPanel';

export function QuestWindow() {
  const wm = useWindowManager();
  const WID: WindowId = 'quests';

  return (
    <BaseWindow
      title="Misiones"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width="min(500px, calc(100vw - 48px))"
      height="min(80vh, 600px)"
    >
      <QuestsPanel />
    </BaseWindow>
  );
}
