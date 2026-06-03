'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { UIWindow } from '@/ui/UIWindow';
import { MOTION } from '@/ui/motions';
import { playUI } from '@/lib/game/audio';
import { layers } from '@/ui/layers';
import { colors, spacing, radii, fontSizes } from '@/ui/theme';
import { useButtonState } from '@/ui/buttonState';

export function ResurrectionModal({ onRevive }: { onRevive: () => void }) {
    const revive = useButtonState();
    const { currentHp } = useGameStore();

    return (
        <AnimatePresence>
            {currentHp <= 0 && (
                <motion.div
                    variants={MOTION.backdrop.variants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={MOTION.backdrop.transition}
                    className="absolute inset-0 flex items-center justify-center p-4 font-sans"
                    style={{ zIndex: layers.modals, backgroundColor: colors.overlayWindow }}
                >
                    <UIWindow title="Has Caído en Combate" isOpen={true} closable={false} type="dialog" className="max-w-sm w-full">
                        <div className="text-center" style={{ padding: `${spacing.sm}px 0` }}>
                            <p
                                className="mb-6 font-sans leading-relaxed"
                                style={{ fontSize: fontSizes.normal, color: colors.textSecondary }}
                            >
                                Tu espíritu ha abandonado tu cuerpo.
                                Puedes regresar a la ciudad más cercana para recuperarte.
                            </p>
                            <button
                                onClick={() => { playUI(); onRevive(); }}
                                className="w-full font-bold transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    fontSize: fontSizes.normal,
                                    color: colors.textWhite,
                                    cursor: 'pointer',
                                    backgroundColor: revive.hovered ? colors.bronze : colors.brown,
                                    border: `2px solid ${revive.hovered ? colors.brown : colors.darkBrown}`,
                                    borderRadius: radii.sm,
                                }}
                                onMouseEnter={revive.onMouseEnter}
                                onMouseLeave={revive.onMouseLeave}
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
