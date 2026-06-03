'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/game/state';
import { Swords, Backpack, Settings } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';

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

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function playUI() {
  try { gameAudio.playUI(); } catch {}
}

export function Actions() {
    const store = useGameStore();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      const id = setInterval(() => setNow(Date.now()), 100);
      return () => clearInterval(id);
    }, []);

    const getCooldownRemaining = useCallback((lastCastTime: number, cooldown: number) => {
      const elapsed = now - lastCastTime;
      if (elapsed >= cooldown) return 0;
      return cooldown - elapsed;
    }, [now]);

    return (
        <div className="flex items-end gap-1.5">
            {/* Skill Slots — Secondary (90%) */}
            <div className="grid grid-cols-3 gap-1.5" style={{ opacity: 0.9 }}>
                {store.skills.slice(0, 6).map((skill) => {
                    const cdRemaining = getCooldownRemaining(skill.lastCastTime, skill.cooldown);
                    const onCooldown = cdRemaining > 0;
                    const insufficientSp = store.currentSp < skill.spCost;
                    const canCast = !onCooldown && !insufficientSp;

                    return (
                        <button
                            key={skill.id}
                            onClick={() => { if (canCast) { playUI(); store.castSkill(skill.id); } }}
                            onPointerDown={() => { if (canCast) playUI(); }}
                            disabled={!canCast}
                            title={`${skill.name}\n${skill.desc}\nSP: ${skill.spCost} | TdE: ${(skill.cooldown / 1000).toFixed(1)}s`}
                            className="relative flex items-center justify-center text-xl transition-all duration-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 6,
                                backgroundColor: skill.color || '#555',
                                borderWidth: 2,
                                borderStyle: 'solid',
                                borderColor: onCooldown ? 'rgba(100,100,100,0.5)' : 'rgba(0,0,0,0.3)',
                                borderBottomWidth: 3,
                                boxShadow: onCooldown
                                  ? 'inset 0 0 0 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                                  : 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.25)',
                                filter: insufficientSp ? 'grayscale(0.6)' : 'none',
                            }}
                        >
                            <span className="select-none drop-shadow-sm">
                                {getSkillIcon(skill.id)}
                            </span>

                            {onCooldown && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded"
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.55)',
                                    }}
                                >
                                    <span className="text-white font-bold text-[10px] drop-shadow-md">
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
                                        backgroundColor: insufficientSp ? '#ef4444' : '#3b82f6',
                                        border: '1px solid rgba(0,0,0,0.4)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <span className="text-white text-[8px] font-bold leading-none px-0.5">
                                        {skill.spCost}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Attack + Utilities */}
            <div className="flex flex-col gap-1.5">
                {/* Main Attack Button — Secondary (90%) */}
                <button
                    onClick={() => { playUI(); store.toggleAutoBattle(); }}
                    onPointerDown={playUI}
                    className={cn(
                        "flex flex-col items-center justify-center transition-all duration-100 active:scale-95",
                        store.autoBattle && "animate-pulse"
                    )}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        opacity: 0.9,
                        backgroundColor: store.autoBattle ? '#C0392B' : '#374151',
                        borderWidth: 2,
                        borderStyle: 'solid',
                        borderColor: store.autoBattle ? '#922B21' : '#4B5563',
                        borderBottomWidth: 3,
                        boxShadow: store.autoBattle
                            ? '0 0 8px rgba(192,57,43,0.4)'
                            : '0 2px 4px rgba(0,0,0,0.25)',
                    }}
                >
                    <Swords size={18} className="text-white" />
                    <span className="text-white text-[8px] font-bold uppercase leading-tight mt-0.5">
                        Atq
                    </span>
                </button>

                {/* Utility buttons row — Tertiary (75%) */}
                <div className="flex gap-1.5" style={{ opacity: 0.75 }}>
                    <button
                        onClick={() => { playUI(); store.toggleInventory(); }}
                        onPointerDown={playUI}
                        className="flex items-center justify-center transition-all duration-100 active:scale-95"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            backgroundColor: 'rgba(55,65,81,0.8)',
                            border: '1px solid rgba(75,85,99,0.6)',
                        }}
                    >
                        <Backpack size={16} className="text-white" />
                    </button>
                    <button
                        onClick={() => { playUI(); useGameStore.setState({ showConfigPanel: !store.showConfigPanel }); }}
                        onPointerDown={playUI}
                        className="flex items-center justify-center transition-all duration-100 active:scale-95"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            backgroundColor: 'rgba(55,65,81,0.8)',
                            border: '1px solid rgba(75,85,99,0.6)',
                        }}
                    >
                        <Settings size={16} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
