'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore, JOB_TREE, defaultStats } from '@/lib/game/state';
import type { JobClass, CharacterStats } from '@/lib/game/types';
import { jobInfo } from '@/lib/game/data/jobs';
import { statTooltips } from '@/lib/game/data/tooltips';
import { RefreshCw, Sparkles, PlusCircle } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

const getStatCost = (currentValue: number): number => {
    if (currentValue < 10) return 2;
    if (currentValue < 20) return 3;
    if (currentValue < 30) return 4;
    if (currentValue < 40) return 5;
    return 6;
};

const StatRow = ({ stat, value, onIncrease, canIncrease, tooltip }: {
    stat: string;
    value: number;
    onIncrease: () => void;
    canIncrease: boolean;
    tooltip?: { title: string; desc: string };
}) => (
    <div className="flex items-center justify-between" style={{ padding: `${spacing.sm}px 0` }}>
        <span
            className="font-bold"
            style={{
                fontSize: fontSizes.sm,
                width: 40,
                color: colors.text.darkGray,
                fontFamily: 'monospace',
            }}
        >
            {stat.toUpperCase()}
        </span>
        <span
            className="font-black"
            style={{
                fontSize: fontSizes.lg,
                color: colors.text.nearBlack,
                fontFamily: 'monospace',
            }}
        >
            {value}
        </span>
        <button
            onClick={() => { try { gameAudio.playUI(); } catch {} onIncrease(); }}
            disabled={!canIncrease}
            className="flex items-center justify-center transition-all duration-100 active:scale-95 disabled:cursor-not-allowed"
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: canIncrease ? 'rgba(46,204,113,0.2)' : 'rgba(128,128,128,0.1)',
                        color: canIncrease ? '#1B7A3D' : '#9CA3AF',
                        borderRadius: radii.full,
                    }}
        >
            <PlusCircle size={16} />
        </button>
    </div>
);

export function StatusPanel() {
    const store = useGameStore();
    const playerName = "Player";
    const [allocModifier, setAllocModifier] = useState<'1' | '5' | '10' | 'MAX'>('1');
    const statsList = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

    const availablePoints = useMemo(() => {
        const spentPoints = statsList.reduce((total, stat) => {
            let cost = 0;
            const baseStat = JOB_TREE[store.jobClass]?.requirement.jobLevel === 1
                ? defaultStats[store.jobClass][stat]
                : 1;
            for (let i = baseStat; i < store.baseStats[stat]; i++) {
                cost += getStatCost(i);
            }
            return total + cost;
        }, 0);
        const totalPoints = (store.stats.level - 1) * 3;
        return totalPoints - spentPoints;
    }, [store.stats.level, store.baseStats, store.jobClass]);

    const handleTactileIncrease = (statName: keyof CharacterStats) => {
        const modifier = allocModifier === 'MAX' ? availablePoints : parseInt(allocModifier);
        let pointsToSpend = Math.min(modifier, availablePoints);
        let currentStatValue = store.baseStats[statName];
        let cost = getStatCost(currentStatValue);
        if (pointsToSpend < cost) return;
        let statIncrease = 0;
        while (pointsToSpend >= cost) {
            pointsToSpend -= cost;
            currentStatValue++;
            statIncrease++;
            cost = getStatCost(currentStatValue);
        }
        if (statIncrease > 0) {
            store.updateStats({ [statName]: store.stats[statName] + statIncrease });
            store.recalculateStats();
        }
    };

    const handleSmartAutoAssign = () => {
        const job = jobInfo[store.jobClass];
        const primaryStat: keyof CharacterStats | undefined = job?.focus.toLowerCase().includes('str') ? 'str'
            : job?.focus.toLowerCase().includes('agi') ? 'agi'
            : job?.focus.toLowerCase().includes('vit') ? 'vit'
            : job?.focus.toLowerCase().includes('int') ? 'int'
            : job?.focus.toLowerCase().includes('dex') ? 'dex'
            : job?.focus.toLowerCase().includes('luk') ? 'luk'
            : undefined;
        if (primaryStat && availablePoints > 0) {
            handleTactileIncrease(primaryStat);
        }
    };

    const handleResetPoints = () => {
        store.updateStats(JOB_TREE[store.jobClass]?.requirement.jobLevel === 1
            ? defaultStats[store.jobClass]
            : store.baseStats);
        store.recalculateStats();
    };

    const baseExpPercent = (store.playerBaseExp / store.playerBaseMaxExp) * 100;
    const jobExpPercent = (store.playerJobExp / store.playerJobMaxExp) * 100;
    const currentJobInfo = jobInfo[store.jobClass];

    return (
        <div style={{ padding: `${spacing.lg}px` }}>
            <div className="mb-6">
                <div
                    className="text-white relative overflow-hidden"
                    style={{
                        padding: spacing.lg,
                        borderRadius: radii.lg,
                        background: `linear-gradient(135deg, #6B4F3A 0%, #4A2E1D 100%)`,
                    }}
                >
                    <div className="flex items-center gap-4 relative z-10 pt-2">
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: 64,
                                height: 64,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: radii.md,
                                border: '2px solid rgba(255,255,255,0.3)',
                                fontSize: '2.5rem',
                            }}
                        >
                            {currentJobInfo.icon}
                        </div>
                        <div>
                            <h3
                                className="font-bold tracking-wide uppercase"
                                style={{ fontSize: fontSizes.xl }}
                            >
                                {playerName}
                            </h3>
                            <div
                                className="inline-block font-mono uppercase tracking-wider"
                                style={{
                                    fontSize: fontSizes.xxs,
                                    color: 'rgba(255,255,255,0.9)',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    borderRadius: radii.sm,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                }}
                            >
                                BASE <span style={{ color: '#FCD34D', margin: '0 4px' }}>{store.stats.level}</span>
                                | JOB <span style={{ color: '#FCD34D', marginLeft: 4 }}>{store.stats.jobLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: -8 }}>
                    <div
                        style={{
                            height: 16,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderBottomLeftRadius: radii.md,
                            borderBottomRightRadius: radii.md,
                            border: '2px solid rgba(0,0,0,0.2)',
                            borderTop: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${baseExpPercent}%`,
                                backgroundColor: 'rgba(56,189,248,0.8)',
                            }}
                        />
                    </div>
                    <div
                        style={{
                            height: 16,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderBottomLeftRadius: radii.md,
                            borderBottomRightRadius: radii.md,
                            border: '2px solid rgba(0,0,0,0.2)',
                            borderTop: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${jobExpPercent}%`,
                                backgroundColor: 'rgba(52,211,153,0.8)',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: spacing.lg, borderRadius: radii.lg }}>
                    <div className="flex justify-between items-center mb-4">
                        <h4
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.sm, color: colors.text.muted }}
                        >
                            Puntos de Stats
                        </h4>
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
                                {availablePoints}
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        {statsList.map(stat => (
                            <StatRow
                                key={stat}
                                stat={stat}
                                value={store.baseStats[stat]}
                                onIncrease={() => handleTactileIncrease(stat as keyof CharacterStats)}
                                canIncrease={availablePoints > 0}
                                tooltip={statTooltips[stat]}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2 mb-3">
                        {['1', '5', '10', 'MAX'].map(mod => (
                            <button
                                key={mod}
                                onClick={() => { try { gameAudio.playUI(); } catch {} setAllocModifier(mod as any); }}
                                className="flex-1 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.xs,
                                    backgroundColor: allocModifier === mod ? '#4F46E5' : 'rgba(0,0,0,0.05)',
                                    color: allocModifier === mod ? colors.text.white : colors.text.muted,
                                    borderColor: allocModifier === mod ? 'transparent' : 'rgba(0,0,0,0.1)',
                                }}
                            >
                                {mod}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { try { gameAudio.playUI(); } catch {} handleSmartAutoAssign(); }}
                            className="flex items-center justify-center gap-2 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.xs,
                                    backgroundColor: 'rgba(245,158,11,0.2)',
                                    color: '#92400E',
                                borderColor: 'rgba(245,158,11,0.2)',
                            }}
                        >
                            <Sparkles size={14} /> Auto-Asignar
                        </button>
                        <button
                            onClick={() => { try { gameAudio.playUI(); } catch {} handleResetPoints(); }}
                            className="flex items-center justify-center gap-2 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.xs,
                                    backgroundColor: 'rgba(239,68,68,0.1)',
                                    color: '#991B1B',
                                borderColor: 'rgba(239,68,68,0.2)',
                            }}
                        >
                            <RefreshCw size={14} /> Reset
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: spacing.lg, borderRadius: radii.lg }}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{ fontSize: fontSizes.sm }}>
                            <p><strong>ATK:</strong> <span className="float-right font-mono">{store.stats.atk}</span></p>
                            <p><strong>DEF:</strong> <span className="float-right font-mono">{store.stats.def}</span></p>
                            <p><strong>MATK:</strong> <span className="float-right font-mono">{store.stats.matk}</span></p>
                            <p><strong>HIT:</strong> <span className="float-right font-mono">{store.stats.hit}</span></p>
                            <p><strong>FLEE:</strong> <span className="float-right font-mono">{store.stats.flee}</span></p>
                            <p><strong>ASPD:</strong> <span className="float-right font-mono">{store.stats.aspd}</span></p>
                            <p><strong>CRIT:</strong> <span className="float-right font-mono">{Math.floor(store.stats.luk / 3)}%</span></p>
                            <p><strong>MOVE SPD:</strong> <span className="float-right font-mono">{store.stats.spd}</span></p>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: spacing.lg, borderRadius: radii.lg }}>
                        <h4
                            className="font-bold uppercase tracking-wider mb-2"
                            style={{ fontSize: fontSizes.sm, color: colors.text.muted }}
                        >
                            Información de Clase
                        </h4>
                        <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, marginBottom: 4 }}>
                            <strong>Rol:</strong> {currentJobInfo.role}
                        </p>
                        <p style={{ fontSize: fontSizes.xs, color: colors.text.muted }}>
                            <strong>Foco:</strong> {currentJobInfo.focus}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
