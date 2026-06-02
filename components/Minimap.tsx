'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';

export function Minimap() {
    const minimapData = useGameStore((state) => {
        if (!state.player) return null;
        return {
            player: state.player.position,
            monsters: state.monsters.map(m => m.position)
        };
    });
    const mapSize = 80; // w-20 h-20
    const scale = 1.5;

    const renderMapContent = () => {
        if (!minimapData) return null;

        return (
            <>
                {/* Player Marker */}
                <div
                    className="absolute w-2 h-2 bg-green-400 rounded-full border border-white z-10"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                {/* Monster Markers */}
                {minimapData.monsters.map((monster, i) => {
                    const dx = (monster.x - minimapData.player.x) * scale;
                    const dz = (monster.z - minimapData.player.z) * scale;

                    if (Math.abs(dx) < mapSize / 2 && Math.abs(dz) < mapSize / 2) {
                        return (
                            <div
                                key={`monster-${i}`}
                                className="absolute w-1.5 h-1.5 bg-red-600 rounded-full"
                                style={{
                                    left: `calc(50% + ${dx}px)`,
                                    top: `calc(50% + ${dz}px)`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        );
                    }
                    return null;
                })}
            </>
        );
    }

    return (
        <div className="w-24 h-24 bg-slate-800/80 backdrop-blur-sm rounded-lg border-t-2 border-x-2 border-b-4 border-slate-700 shadow-lg overflow-hidden">
            <div className="relative w-full h-full">
                {renderMapContent()}
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-black/30 p-1 text-center">
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Prontera</span>
            </div>
        </div>
    );
}
