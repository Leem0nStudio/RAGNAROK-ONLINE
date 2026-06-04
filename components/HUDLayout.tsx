'use client';

import React from 'react';
import { HUDGrid, HUDZoneBox } from '@/ui/HUDGrid';
import { CharacterPanel } from './CharacterPanel';
import { Minimap } from './Minimap';
import { Actions } from './Actions';
import { SkillSlots } from './SkillSlots';
import { Chat } from './Chat';
import { TargetPanel } from './TargetPanel';
import { layers } from '@/ui/layers';
import { ZoneDiscoveryToast } from './ZoneDiscoveryToast';
import { LootFeed } from './LootFeed';
import { BuffBar } from './BuffBar';
import { QuestTracker } from './QuestTracker';

export function HUDLayout() {
    return (
        <>
            <ZoneDiscoveryToast />
            <LootFeed />

            <BuffBar />
            <QuestTracker />

            <HUDGrid>
                <HUDZoneBox zone="player">
                    <CharacterPanel />
                </HUDZoneBox>

                <HUDZoneBox zone="target" justify="center">
                    <TargetPanel />
                </HUDZoneBox>

                <HUDZoneBox zone="minimap" justify="end">
                    <Minimap />
                </HUDZoneBox>

                <HUDZoneBox zone="chat" align="end">
                    <Chat />
                </HUDZoneBox>

                <HUDZoneBox zone="skills" justify="center" align="end">
                    <SkillSlots maxSlots={10} />
                </HUDZoneBox>
            </HUDGrid>

            {/* Actions fuera del grid para evitar overflow en mobile */}
            <div
                className="fixed"
                style={{
                    bottom: 'var(--hud-gap-bottom, 12px)',
                    right: 'var(--hud-gap-right, 12px)',
                    zIndex: layers.hud,
                }}
            >
                <Actions />
            </div>
        </>
    );
}
