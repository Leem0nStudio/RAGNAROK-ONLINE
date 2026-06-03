'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/game/state';
import type { CombatLog } from '@/lib/game/types';
import { gameAudio } from '@/lib/game/audio';
import { spacing, radii } from '@/ui/theme';

const MAX_VISIBLE = 5;

const getLogColor = (type: CombatLog['type']) => {
    switch (type) {
        case 'player_attack': return '#60A5FA';
        case 'monster_attack': return '#F87171';
        case 'heal': return '#4ADE80';
        case 'loot': return '#FACC15';
        case 'mvp': return '#F59E0B';
        default: return '#9CA3AF';
    }
};

export function Chat() {
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
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        borderRadius: radii.md,
                        border: '1px solid rgba(74,46,29,0.5)',
                    }}
                >
                    {recent.length === 0 ? (
                        <p className="text-xs italic" style={{ color: '#888' }}>Esperando eventos...</p>
                    ) : (
                        recent.map((message: CombatLog, index: number) => (
                            <p
                                key={message.id || index}
                                className="font-mono leading-tight text-xs"
                                style={{ color: getLogColor(message.type) }}
                            >
                                <span style={{ color: '#718096', paddingRight: spacing.xs, fontSize: 10 }}>
                                    [{message.timestamp}]
                                </span>
                                {message.text}
                            </p>
                        ))
                    )}
                </div>
            )}
            <button
                onClick={() => { try { gameAudio.playUI(); } catch {} toggleCombatLog(); }}
                className="flex items-center justify-center text-white transition-all duration-100 active:scale-95"
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: showCombatLog ? '#6B4F3A' : 'rgba(0,0,0,0.6)',
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: showCombatLog ? '#8C7853' : '#555',
                    borderBottomWidth: 3,
                    boxShadow: showCombatLog ? '0 0 6px rgba(107,79,58,0.4)' : '0 1px 3px rgba(0,0,0,0.25)',
                }}
                title={showCombatLog ? 'Ocultar bitácora' : 'Mostrar bitácora'}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>
        </div>
    );
}
