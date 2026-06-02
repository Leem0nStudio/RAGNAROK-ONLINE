'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';

export function ExperienceBars() {
    const { playerBaseExp, playerBaseMaxExp, playerJobExp, playerJobMaxExp } = useGameStore();

    const baseExpPercent = (playerBaseExp / playerBaseMaxExp) * 100;
    const jobExpPercent = (playerJobExp / playerJobMaxExp) * 100;

    return (
        <div className="w-1/2">
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden border border-black/50">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${baseExpPercent}%` }} />
            </div>
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden border border-black/50 mt-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${jobExpPercent}%` }} />
            </div>
        </div>
    );
}
