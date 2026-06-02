'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { Swords } from 'lucide-react';

export function TargetHealthBar() {
    const { targetEntityId, targetName, targetHp, targetMaxHp } = useGameStore();

    return (
        <AnimatePresence>
            {targetEntityId && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-sm bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 border-t-2 border-x-2 border-b-4 border-slate-700 shadow-lg flex items-center space-x-3"
                >
                    <div className="relative w-10 h-10 bg-slate-900 rounded-md border-2 border-slate-700 flex items-center justify-center shrink-0">
                        <Swords className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-white truncate">{targetName}</span>
                            <span className="font-mono text-xs text-red-300 font-bold">
                                {targetHp} / {targetMaxHp}
                            </span>
                        </div>
                        <div className="w-full h-3 bg-black/50 rounded-sm border border-black/30 overflow-hidden shadow-inner">
                            <motion.div
                                animate={{ width: `${Math.max(0, (targetHp / targetMaxHp) * 100)}%` }}
                                className="h-full rounded-sm bg-red-600"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
