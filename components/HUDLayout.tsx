'use client';

import React from 'react';
import { layers } from '@/ui/layers';
import { CharacterPanel } from './CharacterPanel';
import { Minimap } from './Minimap';
import { Actions } from './Actions';
import { Chat } from './Chat';
import { TargetHealthBar } from './TargetHealthBar';
import { ZoneDiscoveryToast } from './ZoneDiscoveryToast';

export function HUDLayout() {
    return (
        <>
            <ZoneDiscoveryToast />

            <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: layers.hud }}
            >
                {/* Primary — CharacterPanel (top-left) */}
                <div
                    className="absolute pointer-events-auto"
                    style={{ top: 'var(--hud-gap-top, 12px)', left: 'var(--hud-gap-left, 12px)' }}
                >
                    <CharacterPanel />
                </div>

                {/* Primary — TargetHealthBar (top-center) */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
                    style={{ top: 'var(--hud-gap-top, 12px)' }}
                >
                    <TargetHealthBar />
                </div>

                {/* Tertiary — Minimap (top-right) */}
                <div
                    className="absolute pointer-events-auto"
                    style={{ top: 'var(--hud-gap-top, 12px)', right: 'var(--hud-gap-right, 12px)' }}
                >
                    <Minimap />
                </div>

                {/* Tertiary — Chat (bottom-left) */}
                <div
                    className="absolute pointer-events-auto"
                    style={{ bottom: 'var(--hud-gap-bottom, 12px)', left: 'var(--hud-gap-left, 12px)' }}
                >
                    <Chat />
                </div>

                {/* Secondary — Actions (bottom-right) */}
                <div
                    className="absolute pointer-events-auto"
                    style={{ bottom: 'var(--hud-gap-bottom, 12px)', right: 'var(--hud-gap-right, 12px)' }}
                >
                    <Actions />
                </div>
            </div>
        </>
    );
}
