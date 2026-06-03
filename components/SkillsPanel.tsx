'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import type { Skill } from '@/lib/game/types';
import { BookOpen } from 'lucide-react';
import { MOTION } from '@/ui/motions';
import { playUI } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

export function SkillsPanel() {
    const store = useGameStore();
    const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

    const handleAllocateSkillPoint = (skillId: string) => {
        store.allocateSkillPoint(skillId);
    };

    const isPassiveSkill = (skill: Skill): boolean => {
        const passiveKeywords = ['passive', 'pasiva', 'auto', 'inherent', 'mastery'];
        return passiveKeywords.some(kw => skill.desc.toLowerCase().includes(kw)) || skill.cooldown === 0;
    };

    return (
        <div>
            <div
                className="flex flex-col sm:flex-row justify-between items-center gap-4"
                style={{
                    padding: spacing.lg,
                    backgroundColor: colors.glassCard,
                    borderRadius: radii.lg,
                    marginBottom: spacing.xl,
                }}
            >
                <div>
                    <h3
                        className="font-bold uppercase tracking-wider"
                        style={{ fontSize: fontSizes.normal, color: colors.textGrayLow }}
                    >
                        Libro de Habilidades ({store.jobClass})
                    </h3>
                    {store.skillPoints > 0 ? (
                        <span
                            className="font-bold animate-pulse block mt-0.5"
                            style={{ fontSize: fontSizes.secondary, color: colors.accentIndigo }}
                            >
                                ¡Tienes {store.skillPoints} Puntos de Habilidad disponibles!
                        </span>
                    ) : (
                        <span className="block mt-0.5" style={{ fontSize: fontSizes.secondary, color: colors.disabled }}>
                            Gana Niveles de Trabajo (Job Lv) para obtener más puntos.
                        </span>
                    )}
                </div>
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
                        {store.skillPoints}
                    </span>
                </div>
            </div>

            {store.skills.length === 0 ? (
                <div className="text-center py-12" style={{ color: colors.disabled }}>
                    <BookOpen size={48} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: fontSizes.normal }}>
                        Aún no has aprendido habilidades
                    </p>
                    <p style={{ fontSize: fontSizes.secondary }}>
                        Las habilidades de tu clase aparecerán aquí.
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`skills-${store.skills.length}`}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={MOTION.scaleFade.variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={MOTION.scaleFade.transition}
                    >
                    {store.skills.map((skill, index) => {
                        const isMax = skill.level >= skill.maxLevel;
                        const canLevelUp = store.skillPoints > 0 && !isMax;
                        const isPassive = isPassiveSkill(skill);

                        return (
                            <div
                                key={skill.id}
                                className="flex flex-col justify-between gap-4"
                                style={{
                                    padding: spacing.lg,
                                    backgroundColor: colors.glassCard,
                                    borderRadius: radii.lg,
                                    opacity: skill.level > 0 ? 1 : 0.6,
                                }}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold" style={{ fontSize: fontSizes.normal, color: colors.textGrayDark }}>
                                            {skill.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span
                                                className="font-bold font-mono"
                                                style={{
                                                    fontSize: fontSizes.secondary,
                                                    padding: '4px 10px',
                                                    borderRadius: radii.full,
                                                    backgroundColor: isMax
                                                        ? colors.accentAmberBg
                                                        : colors.accentIndigoBg,
                                                    color: isMax ? colors.accentAmberdark : colors.accentIndigo,
                                                }}
                                            >
                                                Lv.{skill.level}/{skill.maxLevel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className="font-bold"
                                            style={{
                                                fontSize: fontSizes.secondary,
                                                padding: '1px 8px',
                                                borderRadius: radii.sm,
                                                backgroundColor: isPassive ? colors.accentGreenBg : colors.accentIndigoBg,
                                                color: isPassive ? colors.accentDarkgreen : colors.accentIndigo,
                                            }}
                                        >
                                            {isPassive ? 'PASIVA' : 'ACTIVA'}
                                        </span>
                                        {skill.spCost > 0 && (
                                            <span
                                                className="font-mono"
                                                style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                                            >
                                                SP: {skill.spCost}
                                            </span>
                                        )}
                                        {skill.cooldown > 0 && (
                                            <span
                                                className="font-mono"
                                                style={{ fontSize: fontSizes.secondary, color: colors.textMuted }}
                                            >
                                                TdE: {(skill.cooldown / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                    </div>
                                    <p className="leading-relaxed" style={{ fontSize: fontSizes.normal, color: colors.textGrayLow }}>
                                        {skill.desc}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { playUI(); handleAllocateSkillPoint(skill.id); }}
                                    onMouseEnter={() => setHoveredSkill(index)}
                                    onMouseLeave={() => setHoveredSkill(null)}
                                    disabled={!canLevelUp}
                                    className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                    style={{
                                        padding: spacing.sm,
                                        minHeight: 48,
                                        fontSize: fontSizes.normal,
                                        backgroundColor: canLevelUp
                                            ? colors.accentIndigo
                                            : colors.glassExtra,
                                        color: canLevelUp ? colors.textWhite : colors.textMuted,
                                        borderColor: canLevelUp ? 'transparent' : 'transparent',
                                        cursor: canLevelUp ? 'pointer' : 'not-allowed',
                                        filter: canLevelUp && hoveredSkill === index ? 'brightness(1.15)' : undefined,
                                    }}
                                >
                                    {isMax ? 'MAX LVL' : 'SUBIR NIVEL'}
                                </button>
                            </div>
                        );
                    })}
                </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
