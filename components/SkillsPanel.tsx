'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { BookOpen } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

export function SkillsPanel() {
    const store = useGameStore();

    const handleAllocateSkillPoint = (skillId: string) => {
        store.allocateSkillPoint(skillId);
    };

    return (
        <div style={{ padding: spacing.lg }}>
            <div
                className="flex flex-col sm:flex-row justify-between items-center gap-4"
                style={{
                    padding: spacing.lg,
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: radii.lg,
                    marginBottom: spacing.xl,
                }}
            >
                <div>
                    <h3
                        className="font-bold uppercase tracking-wider"
                        style={{ fontSize: fontSizes.sm, color: '#6B7280' }}
                    >
                        Libro de Habilidades ({store.jobClass})
                    </h3>
                    {store.skillPoints > 0 ? (
                        <span
                            className="font-bold animate-pulse block mt-0.5"
                            style={{ fontSize: fontSizes.xs, color: '#4F46E5' }}
                        >
                            ¡Tienes {store.skillPoints} Puntos de Habilidad disponibles!
                        </span>
                    ) : (
                        <span className="block mt-0.5" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            Gana Niveles de Trabajo (Job Lv) para obtener más puntos.
                        </span>
                    )}
                </div>
                <div
                    className="text-center shrink-0"
                    style={{
                        padding: `${spacing.sm}px ${spacing.lg}px`,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: radii.lg,
                    }}
                >
                    <span
                        className="block font-bold uppercase tracking-wider"
                        style={{ fontSize: fontSizes.xxs, color: colors.text.muted }}
                    >
                        Puntos Libres
                    </span>
                    <span
                        className="font-mono font-black"
                        style={{ fontSize: fontSizes.xl, color: '#4F46E5' }}
                    >
                        {store.skillPoints}
                    </span>
                </div>
            </div>

            {store.skills.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                    <BookOpen size={48} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: fontSizes.sm }}>
                        Aún no has aprendido habilidades
                    </p>
                    <p style={{ fontSize: fontSizes.xs }}>
                        Las habilidades de tu clase aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {store.skills.map((skill) => {
                        const isMax = skill.level >= skill.maxLevel;
                        const canLevelUp = store.skillPoints > 0 && !isMax;

                        return (
                            <div
                                key={skill.id}
                                className="flex flex-col justify-between gap-4"
                                style={{
                                    padding: spacing.lg,
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    borderRadius: radii.lg,
                                    opacity: skill.level > 0 ? 1 : 0.6,
                                }}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold" style={{ fontSize: fontSizes.sm, color: '#374151' }}>
                                            {skill.name}
                                        </h4>
                                        <span
                                            className="font-bold font-mono"
                                            style={{
                                                fontSize: fontSizes.xxs,
                                                padding: '4px 10px',
                                                borderRadius: radii.full,
                                                backgroundColor: isMax
                                                    ? 'rgba(245,158,11,0.2)'
                                                    : 'rgba(99,102,241,0.1)',
                                                color: isMax ? '#92400E' : '#4F46E5',
                                            }}
                                        >
                                            Lv.{skill.level}/{skill.maxLevel}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed" style={{ fontSize: fontSizes.xs, color: '#6B7280' }}>
                                        {skill.desc}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { try { gameAudio.playUI(); } catch {} handleAllocateSkillPoint(skill.id); }}
                                    disabled={!canLevelUp}
                                    className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                    style={{
                                        padding: spacing.sm,
                                        minHeight: 48,
                                        fontSize: fontSizes.xs,
                                        backgroundColor: canLevelUp
                                            ? '#4F46E5'
                                            : 'rgba(107,114,128,0.1)',
                                        color: canLevelUp ? colors.text.white : colors.text.muted,
                                        borderColor: canLevelUp ? 'transparent' : 'transparent',
                                        cursor: canLevelUp ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {isMax ? 'MAX LVL' : 'SUBIR NIVEL'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
