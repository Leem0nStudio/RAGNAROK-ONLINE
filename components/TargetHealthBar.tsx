'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { Swords } from 'lucide-react';
import { colors, radii, spacing, fontSizes } from '@/ui/theme';

export function TargetHealthBar() {
    const { targetEntityId, targetName, targetHp, targetMaxHp } = useGameStore();
    const hpPercent = targetMaxHp > 0 ? (targetHp / targetMaxHp) * 100 : 0;

    return (
        <AnimatePresence>
            {targetEntityId && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center p-2 font-serif"
                    style={{
                        maxWidth: 240,
                        backgroundColor: colors.border.darkBrown,
                        borderRadius: radii.md,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                >
                    <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                            width: 36,
                            height: 36,
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderRadius: radii.sm,
                        }}
                    >
                        <Swords className="w-5 h-5" style={{ color: 'rgba(231,76,60,0.7)' }} />
                    </div>
                    <div className="flex-1 min-w-0 mx-2">
                        <div className="flex justify-between items-baseline mb-1 gap-1">
                            <span
                                className="font-bold truncate"
                                style={{ fontSize: fontSizes.xs, color: colors.bg.oldPaper }}
                            >
                                {targetName}
                            </span>
                            <span
                                className="font-bold whitespace-nowrap"
                                style={{ fontSize: fontSizes.xxs, color: 'rgba(253,230,138,0.8)' }}
                            >
                                {targetHp}<span style={{ opacity: 0.7 }}>/{targetMaxHp}</span>
                            </span>
                        </div>
                        <div
                            className="overflow-hidden"
                            style={{
                                height: 8,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderRadius: radii.sm,
                            }}
                        >
                            <motion.div
                                animate={{ width: `${hpPercent}%` }}
                                className="h-full"
                                style={{ backgroundColor: colors.bar.hp }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
