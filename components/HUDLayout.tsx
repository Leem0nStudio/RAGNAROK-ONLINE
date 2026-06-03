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
                <div className="absolute top-2 left-2 pointer-events-auto">
                    <CharacterPanel />
                </div>

                <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto">
                    <TargetHealthBar />
                </div>

                <div className="absolute top-2 right-2 pointer-events-auto">
                    <Minimap />
                </div>

                <div className="absolute bottom-2 left-2 pointer-events-auto">
                    <Chat />
                </div>

                <div className="absolute bottom-2 right-2 pointer-events-auto">
                    <Actions />
                </div>
            </div>
        </>
    );
}
