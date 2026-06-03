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
                    className="flex items-center p-2 font-sans"
                    style={{
                        maxWidth: 240,
                        backgroundColor: colors.darkBrown,
                        borderRadius: radii.md,
                        boxShadow: `0 2px 6px ${colors.overlayDark}`,
                    }}
                >
                    <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                            width: 36,
                            height: 36,
                            backgroundColor: colors.glassMedium,
                            borderRadius: radii.sm,
                        }}
                    >
                        <Swords className="w-5 h-5" style={{ color: colors.hpSoft }} />
                    </div>
                    <div className="flex-1 min-w-0 mx-2">
                        <div className="flex justify-between items-baseline mb-1 gap-1">
                            <span
                                className="font-bold truncate"
                                style={{ fontSize: fontSizes.normal, color: colors.oldPaper }}
                            >
                                {targetName}
                            </span>
                            <span
                                className="font-bold whitespace-nowrap"
                                style={{ fontSize: fontSizes.secondary, color: colors.goldSoft }}
                            >
                                {targetHp}<span style={{ opacity: 0.7 }}>/{targetMaxHp}</span>
                            </span>
                        </div>
                        <div
                            className="overflow-hidden"
                            style={{
                                height: 6,
                                backgroundColor: colors.glassDark,
                                borderRadius: radii.sm,
                            }}
                        >
                            <motion.div
                                animate={{ width: `${hpPercent}%` }}
                                className="h-full"
                                style={{ backgroundColor: colors.hp }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
