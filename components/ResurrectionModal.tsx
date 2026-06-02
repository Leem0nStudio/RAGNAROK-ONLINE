'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { AlertTriangle } from 'lucide-react';

export function ResurrectionModal({ onRevive }: { onRevive: () => void }) {
    const { currentHp } = useGameStore();

    return (
        <AnimatePresence>
            {currentHp <= 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-slate-900 border-4 border-red-700/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                    >
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Has Caído</h2>
                        <p className="text-sm text-slate-300 mb-6">Puedes revivir en la ciudad.</p>
                        <button
                            onClick={onRevive}
                            className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white transition-all"
                        >
                            Volver a Prontera
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
