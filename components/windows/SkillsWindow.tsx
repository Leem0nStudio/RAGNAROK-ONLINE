'use client';

import React from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { SkillsPanel } from '@/components/SkillsPanel';

export function SkillsWindow() {
  const wm = useWindowManager();
  const WID: WindowId = 'skills';

  return (
    <BaseWindow
      title="Habilidades"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width="min(500px, calc(100vw - 48px))"
      height="min(80vh, 600px)"
    >
      <SkillsPanel />
    </BaseWindow>
  );
}
