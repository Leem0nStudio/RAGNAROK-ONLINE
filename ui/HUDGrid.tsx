'use client';

import React from 'react';
import { layers } from './layers';

export const HUD_ZONES = [
  'player',
  'target',
  'minimap',
  'chat',
  'skills',
] as const;

export type HUDZone = (typeof HUD_ZONES)[number];

interface HUDGridProps {
  children: React.ReactNode;
}

export function HUDGrid({ children }: HUDGridProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: layers.hud,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gridTemplateRows: 'auto 1fr auto',
        gridTemplateAreas: `
          "player   target   minimap"
          ".        .        ."
          "chat     skills   ."
        `,
        gap: 0,
        paddingTop: 'var(--hud-gap-top, 12px)',
        paddingBottom: 'var(--hud-gap-bottom, 12px)',
        paddingLeft: 'var(--hud-gap-left, 12px)',
        paddingRight: 'var(--hud-gap-right, 12px)',
      }}
    >
      {children}
    </div>
  );
}

interface HUDZoneBoxProps {
  zone: HUDZone;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end';
}

export function HUDZoneBox({ zone, children, align = 'start', justify = 'start' }: HUDZoneBoxProps) {
  return (
    <div
      className="pointer-events-auto flex"
      style={{
        gridArea: zone,
        alignSelf: align === 'center' ? 'center' : align === 'end' ? 'end' : 'start',
        justifySelf: justify === 'center' ? 'center' : justify === 'end' ? 'end' : 'start',
        alignItems: align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start',
        justifyContent: justify === 'center' ? 'center' : justify === 'end' ? 'flex-end' : 'flex-start',
      }}
    >
      {children}
    </div>
  );
}
