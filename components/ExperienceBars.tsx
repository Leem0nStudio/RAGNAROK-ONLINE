'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { colors } from '@/ui/theme';

export function ExperienceBars() {
    const { playerBaseExp, playerBaseMaxExp, playerJobExp, playerJobMaxExp } = useGameStore();
    const baseExpPercent = playerBaseMaxExp > 0 ? (playerBaseExp / playerBaseMaxExp) * 100 : 0;
    const jobExpPercent = playerJobMaxExp > 0 ? (playerJobExp / playerJobMaxExp) * 100 : 0;

    return (
        <div className="w-full flex gap-1" style={{ height: 4 }}>
            <div
                className="flex-1 overflow-hidden"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 2 }}
            >
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${baseExpPercent}%`,
                        backgroundColor: colors.bar.exp,
                        borderRadius: 2,
                    }}
                />
            </div>
            <div
                className="flex-1 overflow-hidden"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 2 }}
            >
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${jobExpPercent}%`,
                        backgroundColor: colors.bar.jobExp,
                        borderRadius: 2,
                    }}
                />
            </div>
        </div>
    );
}
