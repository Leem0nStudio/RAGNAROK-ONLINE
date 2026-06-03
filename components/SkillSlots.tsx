'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import { MOTION } from '@/ui/motions';
import { colors, fontSizes } from '@/ui/theme';
import { playUI } from '@/lib/game/audio';

const SKILL_ICONS: Record<string, string> = {
  first_aid: '🩹',
  basic_skill: '📖',
  play_dead: '💀',
  bash: '⚔️',
  magnum_break: '🔥',
  heal: '✨',
  holy_light: '☀️',
  double_attack: '⚡',
  stealth_attack: '🗡️',
  double_strafe: '🏹',
  arrow_shower: '🌧️',
  fire_bolt: '🔥',
  cold_bolt: '❄️',
  mammonite: '💰',
  cart_revolution: '🛒',
  bowling_bash: '💥',
  holy_cross: '✝️',
  grand_cross: '☀️',
  meteor_storm: '☄️',
  earth_spike: '🪨',
  heaven_drive: '🌍',
  claymore_trap: '💣',
  musical_strike: '🎵',
  arrow_vulcan: '🎯',
  sling_arrow: '🎯',
  magnus_exorcismus: '📿',
  triple_attack: '👊',
  guillotine_fist: '💢',
  cart_termination: '💥',
  acid_terror: '🧪',
  bomb: '💣',
  sonic_blow: '💨',
  venom_splasher: '🧪',
  back_stab: '🔪',
  strip_shield: '🛡️',
  chain_lightning: '⚡',
  double_bolt: '🔮',
  falcon_strike: '🦅',
  shield_boomerang: '🪃',
  vulcan_arm: '🎯',
  steel_body: '🧊',
  maximum_power_thrust: '💪',
  acid_demonstration: '🧪',
  potion_pitcher: '🧴',
  grimtooth: '👻',
  chase_walk: '👣',
};

function getSkillIcon(skillId: string): string {
  return SKILL_ICONS[skillId] || '❓';
}

interface SkillSlotsProps {
  maxSlots?: number;
}

export function SkillSlots({ maxSlots = 10 }: SkillSlotsProps) {
  const store = useGameStore();
  const [now, setNow] = useState(Date.now());
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const getCooldownRemaining = useCallback((lastCastTime: number, cooldown: number) => {
    const elapsed = now - lastCastTime;
    if (elapsed >= cooldown) return 0;
    return cooldown - elapsed;
  }, [now]);

  const visibleSkills = store.skills.slice(0, maxSlots);
  const cols = Math.min(visibleSkills.length, 5);
  const emptySlots = maxSlots - visibleSkills.length;

  return (
    <div className="flex flex-col gap-1" style={{ opacity: 0.9 }}>
      <motion.div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
        variants={MOTION.scaleFade.variants}
        initial="hidden"
        animate="visible"
        transition={MOTION.scaleFade.transition}
      >
        {visibleSkills.map((skill, index) => {
          const cdRemaining = getCooldownRemaining(skill.lastCastTime, skill.cooldown);
          const onCooldown = cdRemaining > 0;
          const insufficientSp = store.currentSp < skill.spCost;
          const canCast = !onCooldown && !insufficientSp;

          return (
            <button
              key={skill.id}
              onClick={() => { if (canCast) { playUI(); store.castSkill(skill.id); } }}
              onPointerDown={() => { if (canCast) playUI(); }}
              onMouseEnter={() => setHoveredSkill(index)}
              onMouseLeave={() => setHoveredSkill(null)}
              disabled={!canCast}
              title={`${skill.name}\n${skill.desc}\nSP: ${skill.spCost} | TdE: ${(skill.cooldown / 1000).toFixed(1)}s`}
              className="relative flex items-center justify-center transition-all duration-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                fontSize: fontSizes.name,
                backgroundColor: skill.color || colors.disabled,
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: onCooldown ? colors.glassDark : colors.glassMedium,
                borderBottomWidth: 3,
                boxShadow: onCooldown
                  ? `inset 0 0 0 2px ${colors.glassMedium}, 0 1px 2px ${colors.overlayLight}`
                  : `inset 0 1px 0 ${colors.textWhiteDim}, 0 2px 4px ${colors.overlayDark}`,
                filter: insufficientSp ? 'grayscale(0.6)' : (hoveredSkill === index ? 'brightness(1.15)' : 'none'),
              }}
            >
              <span className="select-none drop-shadow-sm">
                {getSkillIcon(skill.id)}
              </span>

              {onCooldown && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded"
                  style={{ backgroundColor: colors.overlayHeavy }}
                >
                  <span className="text-white font-bold font-mono drop-shadow-md" style={{ fontSize: fontSizes.secondary }}>
                    {(cdRemaining / 1000).toFixed(1)}
                  </span>
                </div>
              )}

              {!onCooldown && skill.spCost > 0 && (
                <div
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full"
                  style={{
                    minWidth: 16,
                    height: 16,
                    backgroundColor: insufficientSp ? colors.accentRed : colors.accentBlue,
                    border: `1px solid ${colors.overlayMedium}`,
                    boxShadow: `0 1px 2px ${colors.overlayLight}`,
                  }}
                >
                  <span className="text-white font-bold leading-none px-0.5" style={{ fontSize: fontSizes.secondary }}>
                    {skill.spCost}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </motion.div>
      {emptySlots > 0 && (
        <div className="flex gap-1">
          {Array.from({ length: Math.min(emptySlots, cols) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                backgroundColor: colors.glassCard,
                border: `1px dashed ${colors.glassMedium}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
