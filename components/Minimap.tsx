'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import type { Entity } from '@/lib/game/types';
import { Crown } from 'lucide-react';
import { colors, radii, spacing } from '@/ui/theme';

const MAP_SIZE = 60;
const MAP_SCALE = 0.12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MapMarker = ({ entity }: { entity: Entity }) => {
    const position = {
        x: entity.x * MAP_SCALE + MAP_SIZE / 2,
        y: entity.z * MAP_SCALE + MAP_SIZE / 2,
    };

    const clampedX = clamp(position.x, 6, MAP_SIZE - 6);
    const clampedY = clamp(position.y, 6, MAP_SIZE - 6);

    const style = {
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform: 'translate(-50%, -50%)',
    };

    if (entity.type === 'player') {
        return (
            <div
                className="absolute w-2.5 h-2.5 rounded-full border border-white"
                style={{ ...style, backgroundColor: '#F1C40F' }}
            />
        );
    }

    if (entity.type === 'boss_mvp') {
        return (
            <div className="absolute animate-pulse" style={{ ...style, color: '#7C3AED' }}>
                <Crown size={12} strokeWidth={2.5} />
            </div>
        );
    }

    return (
        <div
            className="absolute w-2 h-2 rounded-full"
            style={{ ...style, backgroundColor: '#EF4444', border: '1px solid #991B1B' }}
        />
    );
};

export function Minimap() {
    const entities = useGameStore(s => s.entities);
    const currentMapName = useGameStore(s => s.currentMapName);
    const player = Array.isArray(entities) ? entities.find((e: Entity) => e.type === 'player') : null;
    const otherEntities = Array.isArray(entities) ? entities.filter((e: Entity) => e.type !== 'player') : [];

    return (
        <div
            className="overflow-hidden"
            style={{
                width: MAP_SIZE + spacing.xs * 2,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: radii.md,
                border: `1px solid ${colors.border.darkBrown}`,
            }}
        >
            <div
                className="relative"
                style={{
                    width: MAP_SIZE,
                    height: MAP_SIZE,
                    margin: spacing.xs,
                    backgroundColor: colors.bg.oldPaper,
                }}
            >
                {otherEntities.map((entity: Entity) => <MapMarker key={entity.id} entity={entity} />)}
                {player && <MapMarker key={player.id} entity={player} />}
            </div>
        </div>
    );
}
