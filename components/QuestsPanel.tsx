'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import type { QuestDefinition } from '@/lib/game/types';
import { ScrollText, CheckCircle, Circle, XCircle } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

export function QuestsPanel() {
    const store = useGameStore();

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
                            backgroundColor: 'rgba(16,185,129,0.2)',
                            borderRadius: radii.xl,
                            color: '#065F46',
                        }}
                    >
                        <Map size={20} />
                    </div>
                    <div>
                        <h3
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.sm, color: '#6B7280' }}
                        >
                            Misiones Activas
                        </h3>
                        <p style={{ fontSize: fontSizes.xs, color: '#9CA3AF' }}>
                            {store.activeQuests.length} activas en tu diario.
                        </p>
                    </div>
                </div>

                {store.activeQuests.length === 0 ? (
                    <div className="text-center py-12" style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: radii.lg, color: colors.text.muted }}>
                        <Map size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
                        <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: fontSizes.sm }}>
                            No hay misiones activas
                        </p>
                        <p style={{ fontSize: fontSizes.xs }}>
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
                                        backgroundColor: allDone ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)',
                                    }}
                                >
                                    <h4
                                        className="font-bold uppercase tracking-wider mb-1"
                                        style={{
                                            fontSize: fontSizes.sm,
                                            color: allDone ? '#065F46' : '#374151',
                                        }}
                                    >
                                        {questDef.isMainQuest && (
                                            <span style={{ color: '#F59E0B', marginRight: 4 }}>★</span>
                                        )}
                                        {questDef.name}
                                    </h4>
                                    <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
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
                                                        fontSize: fontSizes.xs,
                                                        color: isComplete ? '#9CA3AF' : '#374151',
                                                        textDecoration: isComplete ? 'line-through' : 'none',
                                                    }}
                                                >
                                                    {isComplete
                                                        ? <CheckCircle size={14} style={{ color: '#16A34A' }} />
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
                                        <div style={{ marginTop: spacing.lg, paddingTop: spacing.sm, borderTop: `1px solid rgba(0,0,0,0.1)` }}>
                                            <button
                                                onClick={() => { try { gameAudio.playUI(); } catch {} handleAbandonQuest(qId); }}
                                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-100 active:scale-95"
                                                style={{
                                                    padding: spacing.sm,
                                                    minHeight: 48,
                                                    fontSize: fontSizes.xs,
                                                    color: '#6B7280',
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
                            backgroundColor: 'rgba(245,158,11,0.2)',
                            borderRadius: radii.xl,
                            color: '#92400E',
                        }}
                    >
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.sm, color: '#6B7280' }}
                        >
                            Historial de Misiones
                        </h3>
                        <p style={{ fontSize: fontSizes.xs, color: '#9CA3AF' }}>
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
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        borderRadius: radii.lg,
                                    }}
                                >
                                    <span className="font-bold" style={{ fontSize: fontSizes.xs, color: '#9CA3AF' }}>
                                        {questDef?.name || 'Misión Desconocida'}
                                    </span>
                                    <CheckCircle size={16} style={{ color: '#16A34A' }} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
