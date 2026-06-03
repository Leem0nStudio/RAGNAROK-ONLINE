'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/game/state';
import type { QuestDefinition } from '@/lib/game/types';
import { ScrollText, CheckCircle, Circle, XCircle, Map, Trophy } from 'lucide-react';
import { playUI } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

export function QuestsPanel() {
    const store = useGameStore();
    const [abandonHovered, setAbandonHovered] = useState(false);

    const handleAbandonQuest = (questId: string) => {
        if (window.confirm('¿Estás seguro de que quieres abandonar esta misión? Tu progreso se perderá.')) {
            store.abandonQuest(questId);
        }
    };

    return (
        <div style={{ padding: spacing.lg }}>
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 40,
                            height: 40,
                            backgroundColor: colors.accentGreenBg,
                            borderRadius: radii.xl,
                            color: colors.accentDarkgreen,
                        }}
                    >
                        <Map size={20} />
                    </div>
                    <div>
                        <h3
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.normal, color: colors.textGrayLow }}
                        >
                            Misiones Activas
                        </h3>
                        <p style={{ fontSize: fontSizes.secondary, color: colors.disabled }}>
                            {store.activeQuests.length} activas en tu diario.
                        </p>
                    </div>
                </div>

                {store.activeQuests.length === 0 ? (
                    <div className="text-center py-12" style={{ backgroundColor: colors.glassCard, borderRadius: radii.lg, color: colors.textMuted }}>
                        <Map size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
                        <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: fontSizes.normal }}>
                            No hay misiones activas
                        </p>
                        <p style={{ fontSize: fontSizes.secondary }}>
                            Habla con los NPCs para obtener misiones.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {store.activeQuests.map(qId => {
                            const questDef = store.quests.find(q => q.id === qId);
                            const progress = store.questProgress[qId];
                            if (!questDef || !progress) return null;
                            const allDone = progress.every(o => o.current >= o.count);
                            return (
                                <div
                                    key={qId}
                                    style={{
                                        padding: spacing.lg,
                                        borderRadius: radii.lg,
                                        backgroundColor: allDone ? colors.accentGreenBg : colors.glassCard,
                                    }}
                                >
                                    <h4
                                        className="font-bold uppercase tracking-wider mb-1"
                                    style={{
                                        fontSize: fontSizes.normal,
                                        color: allDone ? colors.accentDarkgreen : colors.textGrayDark,
                                    }}
                                >
                                    {questDef.isMainQuest && (
                                            <span style={{ color: colors.accentAmber, marginRight: 4 }}>★</span>
                                        )}
                                        {questDef.name}
                                    </h4>
                                    <p className="mb-4 leading-relaxed" style={{ color: colors.textGrayLow, fontSize: fontSizes.normal }}>
                                        {questDef.description}
                                    </p>
                                    <div className="space-y-2">
                                        {questDef.objectives.map((obj, i) => {
                                            const prog = progress[i];
                                            const isComplete = prog.current >= prog.count;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2"
                                                    style={{
                                                        fontSize: fontSizes.secondary,
                                                        color: isComplete ? colors.disabled : colors.textGrayDark,
                                                        textDecoration: isComplete ? 'line-through' : 'none',
                                                    }}
                                                >
                                                    {isComplete
                                                        ? <CheckCircle size={14} style={{ color: colors.accentGreen }} />
                                                        : <Circle size={14} />
                                                    }
                                                    <span>{obj.description}</span>
                                                    <span className="font-mono ml-auto">
                                                        ({prog.current}/{prog.count})
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!questDef.isMainQuest && (
                                        <div style={{ marginTop: spacing.lg, paddingTop: spacing.sm, borderTop: `1px solid ${colors.borderBlackLight}` }}>
                                            <button
                                                onClick={() => { playUI(); handleAbandonQuest(qId); }}
                                                onMouseEnter={() => setAbandonHovered(true)}
                                                onMouseLeave={() => setAbandonHovered(false)}
                                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-100 active:scale-95"
                                                style={{
                                                    padding: spacing.sm,
                                                    minHeight: 48,
                                                    fontSize: fontSizes.secondary,
                                                    color: colors.textGrayLow,
                                                    filter: abandonHovered ? 'brightness(1.15)' : undefined,
                                                }}
                                            >
                                                <XCircle size={14} /> Abandonar Misión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 40,
                            height: 40,
                            backgroundColor: colors.accentAmberBg,
                            borderRadius: radii.xl,
                            color: colors.accentAmberdark,
                        }}
                    >
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.normal, color: colors.textGrayLow }}
                        >
                            Historial de Misiones
                        </h3>
                        <p style={{ fontSize: fontSizes.secondary, color: colors.disabled }}>
                            {store.completedQuests.length} misiones completadas.
                        </p>
                    </div>
                </div>
                {store.completedQuests.length > 0 && (
                    <div className="space-y-2">
                        {store.completedQuests.map(qId => {
                            const questDef = store.quests.find(q => q.id === qId);
                            return (
                                <div
                                    key={qId}
                                    className="flex items-center justify-between"
                                    style={{
                                        padding: spacing.sm,
                                        backgroundColor: colors.glassCard,
                                        borderRadius: radii.lg,
                                    }}
                                >
                                    <span className="font-bold" style={{ fontSize: fontSizes.secondary, color: colors.disabled }}>
                                        {questDef?.name || 'Misión Desconocida'}
                                    </span>
                                    <CheckCircle size={16} style={{ color: colors.accentGreen }} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
