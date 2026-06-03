'use client';

import React, { useState, useMemo } from 'react';
import { useButtonState } from '@/ui/buttonState';
import { useGameStore, JOB_TREE, defaultStats } from '@/lib/game/state';
import type { JobClass, CharacterStats } from '@/lib/game/types';
import { jobInfo } from '@/lib/game/data/jobs';
import { statTooltips } from '@/lib/game/data/tooltips';
import { RefreshCw, Sparkles, PlusCircle } from 'lucide-react';
import { playUI } from '@/lib/game/audio';
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
}) => {
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);
    return (
        <div className="flex items-center justify-between" style={{ padding: `${spacing.sm}px 0` }}>
        <span
            className="font-bold"
            style={{
                fontSize: fontSizes.secondary,
                width: 40,
                color: colors.textSecondary,
                fontFamily: 'monospace',
            }}
        >
            {stat.toUpperCase()}
        </span>
        <span
            className="font-black"
            style={{
                fontSize: fontSizes.name,
                color: colors.textPrimary,
                fontFamily: 'monospace',
            }}
        >
            {value}
        </span>
        <button
            onClick={() => { playUI(); onIncrease(); }}
            disabled={!canIncrease}
            onMouseEnter={() => setHoveredStat(stat)}
            onMouseLeave={() => setHoveredStat(null)}
            className="flex items-center justify-center transition-all duration-100 active:scale-95 disabled:cursor-not-allowed"
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: canIncrease ? colors.accentGreenBg : colors.disabledBg,
                        color: canIncrease ? colors.accentDarkgreen : colors.textGray5,
                        borderRadius: radii.full,
                        filter: hoveredStat === stat && canIncrease ? 'brightness(1.2)' : undefined,
                    }}
        >
            <PlusCircle size={16} />
        </button>
    </div>
    );
};

const STATS_LIST = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

export function StatusPanel() {
    const store = useGameStore();
    const playerName = "Player";
    const [allocModifier, setAllocModifier] = useState<'1' | '5' | '10' | 'MAX'>('1');
    const [hoveredMod, setHoveredMod] = useState<string | null>(null);
    const auto = useButtonState();
    const reset = useButtonState();

    const availablePoints = useMemo(() => {
        const spentPoints = STATS_LIST.reduce((total, stat) => {
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
                        background: `linear-gradient(135deg, ${colors.brown} 0%, ${colors.darkBrown} 100%)`,
                    }}
                >
                    <div className="flex items-center gap-4 pt-2">
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: 64,
                                height: 64,
                                backgroundColor: colors.glassMedium,
                                borderRadius: radii.md,
                                border: `2px solid ${colors.textWhiteMedium}`,
                                fontSize: '2.5rem',
                            }}
                        >
                            {currentJobInfo.icon}
                        </div>
                        <div>
                            <h3
                                className="font-bold tracking-wide uppercase"
                                style={{ fontSize: fontSizes.name }}
                            >
                                {playerName}
                            </h3>
                            <div
                                className="inline-block font-mono uppercase tracking-wider"
                                style={{
                                    fontSize: fontSizes.secondary,
                                    color: colors.textWhiteSoft,
                                    padding: '2px 8px',
                                    backgroundColor: colors.overlayMedium,
                                    borderRadius: radii.sm,
                                    border: `1px solid ${colors.textWhiteLight}`,
                                }}
                            >
                                BASE <span style={{ color: colors.textGold, margin: '0 4px' }}>{store.stats.level}</span>
                                | JOB <span style={{ color: colors.textGold, marginLeft: 4 }}>{store.stats.jobLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: -8 }}>
                    <div
                        style={{
                            height: 16,
                            backgroundColor: colors.glassLight,
                            borderBottomLeftRadius: radii.md,
                            borderBottomRightRadius: radii.md,
                            border: `2px solid ${colors.glassLight}`,
                            borderTop: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${baseExpPercent}%`,
                                backgroundColor: colors.accentBlueSoft,
                            }}
                        />
                    </div>
                    <div
                        style={{
                            height: 16,
                            backgroundColor: colors.glassLight,
                            borderBottomLeftRadius: radii.md,
                            borderBottomRightRadius: radii.md,
                            border: `2px solid ${colors.glassLight}`,
                            borderTop: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${jobExpPercent}%`,
                                backgroundColor: colors.accentGreenBrightBg,
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ backgroundColor: colors.glassCard, padding: spacing.lg, borderRadius: radii.lg }}>
                    <div className="flex justify-between items-center mb-4">
                        <h4
                            className="font-bold uppercase tracking-wider"
                            style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                        >
                            Puntos de Stats
                        </h4>
                        <div
                            className="text-center shrink-0"
                            style={{
                                padding: `${spacing.sm}px ${spacing.lg}px`,
                                backgroundColor: colors.glassExtra,
                                borderRadius: radii.lg,
                            }}
                        >
                            <span
                                className="block font-bold uppercase tracking-wider"
                                style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                            >
                                Puntos Libres
                            </span>
                            <span
                                className="font-mono font-black"
                                style={{ fontSize: fontSizes.name, color: colors.accentIndigo }}
                            >
                                {availablePoints}
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        {STATS_LIST.map(stat => (
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
                                onClick={() => { playUI(); setAllocModifier(mod as any); }}
                                onMouseEnter={() => setHoveredMod(mod)}
                                onMouseLeave={() => setHoveredMod(null)}
                                className="flex-1 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.secondary,
                                    backgroundColor: allocModifier === mod ? colors.accentIndigo : colors.glassCard,
                                    color: allocModifier === mod ? colors.textWhite : colors.textMuted,
                                    borderColor: allocModifier === mod ? 'transparent' : colors.glassExtra,
                                    filter: hoveredMod === mod ? 'brightness(1.15)' : undefined,
                                }}
                            >
                                {mod}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { playUI(); handleSmartAutoAssign(); }}
                            onMouseEnter={auto.onMouseEnter}
                            onMouseLeave={auto.onMouseLeave}
                            className="flex items-center justify-center gap-2 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.secondary,
                                    backgroundColor: colors.accentAmberBg,
                                    color: colors.accentAmberdark,
                                borderColor: colors.accentAmberBg,
                                filter: auto.hovered ? 'brightness(1.15)' : undefined,
                            }}
                        >
                            <Sparkles size={14} /> Auto-Asignar
                        </button>
                        <button
                            onClick={() => { playUI(); handleResetPoints(); }}
                            onMouseEnter={reset.onMouseEnter}
                            onMouseLeave={reset.onMouseLeave}
                            className="flex items-center justify-center gap-2 font-bold rounded-md border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: `${spacing.sm}px 0`,
                                    minHeight: 48,
                                    fontSize: fontSizes.secondary,
                                    backgroundColor: colors.accentRedBg,
                                    color: colors.accentReddark,
                                borderColor: colors.accentRedBg,
                                filter: reset.hovered ? 'brightness(1.15)' : undefined,
                            }}
                        >
                            <RefreshCw size={14} /> Reset
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div style={{ backgroundColor: colors.glassCard, padding: spacing.lg, borderRadius: radii.lg }}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{ fontSize: fontSizes.secondary }}>
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
                    <div style={{ backgroundColor: colors.glassCard, padding: spacing.lg, borderRadius: radii.lg }}>
                        <h4
                            className="font-bold uppercase tracking-wider mb-2"
                            style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                        >
                            Información de Clase
                        </h4>
                        <p style={{ fontSize: fontSizes.secondary, color: colors.textMuted, marginBottom: 4 }}>
                            <strong>Rol:</strong> {currentJobInfo.role}
                        </p>
                        <p style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}>
                            <strong>Foco:</strong> {currentJobInfo.focus}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
