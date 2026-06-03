'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { UIWindow } from '@/ui/UIWindow';
import { gameAudio } from '@/lib/game/audio';
import { layers } from '@/ui/layers';
import { colors, spacing, radii, fontSizes } from '@/ui/theme';

export function ResurrectionModal({ onRevive }: { onRevive: () => void }) {
    const { currentHp } = useGameStore();

    return (
        <AnimatePresence>
            {currentHp <= 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-4 font-serif"
                    style={{ zIndex: layers.modals, backgroundColor: 'rgba(15, 10, 8, 0.55)' }}
                >
                    <UIWindow title="Has Caído en Combate" isOpen={true} closable={false} type="dialog" className="max-w-sm w-full">
                        <div className="text-center" style={{ padding: `${spacing.sm}px 0` }}>
                            <p
                                className="mb-6 font-sans leading-relaxed"
                                style={{ fontSize: fontSizes.sm, color: colors.text.darkGray }}
                            >
                                Tu espíritu ha abandonado tu cuerpo.
                                Puedes regresar a la ciudad más cercana para recuperarte.
                            </p>
                            <button
                                onClick={() => { try { gameAudio.playUI(); } catch {} onRevive(); }}
                                className="w-full font-bold transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    fontSize: fontSizes.base,
                                    color: colors.text.white,
                                    backgroundColor: colors.border.woodBrown,
                                    border: `2px solid ${colors.border.darkBrown}`,
                                    borderRadius: radii.sm,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8A6F5A'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.border.woodBrown; }}
                            >
                                Volver a Prontera
                            </button>
                        </div>
                    </UIWindow>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
