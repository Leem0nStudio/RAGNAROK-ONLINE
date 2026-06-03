'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import type { CombatLog } from '@/lib/game/types';
import { MOTION } from '@/ui/motions';
import { playUI } from '@/lib/game/audio';
import { colors, spacing, radii, fontSizes, hudOpacity } from '@/ui/theme';
import { useButtonState } from '@/ui/buttonState';

const MAX_VISIBLE = 5;

const getLogColor = (type: CombatLog['type']) => {
    switch (type) {
        case 'player_attack': return colors.chatPlayer;
        case 'monster_attack': return colors.chatMonster;
        case 'heal': return colors.chatHeal;
        case 'loot': return colors.chatLoot;
        case 'mvp': return colors.chatMvp;
        default: return colors.chatDefault;
    }
};

export function Chat() {
    const chat = useButtonState();
    const combatLogs = useGameStore(s => s.combatLogs);
    const showCombatLog = useGameStore(s => s.showCombatLog);
    const containerRef = useRef<HTMLDivElement>(null);
    const recent = Array.isArray(combatLogs) ? combatLogs.slice(-MAX_VISIBLE) : [];
    const toggleCombatLog = () => useGameStore.setState(prev => ({ showCombatLog: !prev.showCombatLog }));

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [combatLogs]);

    return (
        <div className="flex flex-col gap-2">
            {showCombatLog && (
                    <div
                        ref={containerRef}
                        className="overflow-y-auto"
                        style={{
                            maxWidth: 304,
                            maxHeight: 80,
                            padding: spacing.sm,
                            opacity: hudOpacity.secondary,
                            backgroundColor: colors.overlayDarker,
                            borderRadius: radii.md,
                            border: `1px solid ${colors.borderLight}`,
                        }}
                    >
                    {recent.length === 0 ? null : (
                        <AnimatePresence initial={false}>
                            {recent.map((message: CombatLog, index: number) => (
                                <motion.p
                                    key={message.id || index}
                                    className="font-mono leading-tight"
                                    style={{ color: getLogColor(message.type), fontSize: fontSizes.secondary }}
                                    variants={MOTION.fadeSlide.variants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={MOTION.fadeSlide.transition}
                                    layout
                                >
                                    <span style={{ color: colors.textGray5, paddingRight: spacing.xs, fontSize: fontSizes.secondary }}>
                                        [{message.timestamp}]
                                    </span>
                                    {message.text}
                                </motion.p>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            )}
            <button
                onClick={() => { playUI(); toggleCombatLog(); }}
                className="flex items-center justify-center text-white transition-all duration-100 active:scale-95"
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    opacity: hudOpacity.primary,
                    backgroundColor: showCombatLog ? colors.brown : colors.overlayDark,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: showCombatLog ? colors.bronze : colors.disabled,
                    borderBottomWidth: 3,
                    boxShadow: showCombatLog ? `0 0 6px ${colors.brownSoft}` : `0 1px 3px ${colors.overlayDark}`,
                    filter: chat.hovered ? 'brightness(1.15)' : undefined,
                }}
                onMouseEnter={chat.onMouseEnter}
                onMouseLeave={chat.onMouseLeave}
                title={showCombatLog ? 'Ocultar bitácora' : 'Mostrar bitácora'}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>
        </div>
    );
}
