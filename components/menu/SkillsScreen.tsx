'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Info, Zap, Shield, CircleX } from 'lucide-react';
import { useGameStore } from '../../lib/game/state';

interface SkillsScreenProps {
  triggerHaptic: (pattern: number | number[]) => void;
}

const SKILL_ICONS: Record<string, string> = {
  basic_skill: '📜',
  first_aid: '🩹',
  play_dead: '💀',
  sword_mastery: '⚔️',
  bash: '💥',
  increase_hp_rec: '❤️',
  magnum_break: '🔥',
  divine_protection: '🛡️',
  heal: '✨',
  holy_light: '☀️',
  blessing_spell: '🙏',
  double_attack: '⚡',
  dodge_passive: '💨',
  stealth_attack: '🧪',
  hiding: '👣',
  owls_eye: '🦉',
  vultures_eye: '🦅',
  double_strafe: '🏹',
  arrow_shower: '🌪️',
  increase_sp_rec: '🌀',
  fire_bolt: '☄️',
  cold_bolt: '❄️',
  fire_wall: '🧱',
  enlarge_weight: '🎒',
  mammonite: '💰',
  cart_revolution: '🛒',
};

export const SkillsScreen = ({ triggerHaptic }: SkillsScreenProps) => {
  const store = useGameStore();
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  
  const availableSkills = store.skills;
  const hasPoints = store.skillPoints > 0;

  // Calculate connections for the tree
  const connections = useMemo(() => {
    return availableSkills.flatMap(skill => 
      (skill.dependencies || []).map(dep => {
        const parent = availableSkills.find(s => s.id === dep.skillId);
        if (!parent) return null;
        
        const isUnlocked = skill.level > 0;
        const isParentMet = parent.level >= dep.level;
        const isActive = isUnlocked && isParentMet;

        return {
          id: `${parent.id}-${skill.id}`,
          x1: parent.x ?? 200,
          y1: parent.y ?? 0,
          x2: skill.x ?? 200,
          y2: skill.y ?? 0,
          isActive,
          isVisible: true
        };
      }).filter((conn): conn is any => conn !== null)
    );
  }, [availableSkills]);

  const selectedSkill = useMemo(() => 
    availableSkills.find(s => s.id === selectedSkillId) || null
  , [availableSkills, selectedSkillId]);

  // Determine tree dimensions for scaling
  const treeBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    availableSkills.forEach(s => {
      const sx = s.x ?? 200;
      const sy = s.y ?? 0;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    });
    // Add padding
    return {
      width: Math.max(300, maxX - minX + 100),
      height: Math.max(400, maxY - minY + 120),
      offX: minX - 50,
      offY: minY - 50
    };
  }, [availableSkills]);

  const handleAllocate = (skillId: string) => {
    store.allocateSkillPoint(skillId);
    triggerHaptic(15);
  };

  const handleHotbarAssign = (skillId: string, slotIndex: number) => {
    const isAssigned = store.equippedSkills[slotIndex] === skillId;
    store.assignSkillToHotbar(isAssigned ? '' : skillId, slotIndex);
    triggerHaptic(10);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#040811] rounded-3xl overflow-hidden border border-slate-900 shadow-2xl relative" id="skill-tree-container">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600 rounded-full blur-[100px]" />
      </div>

      {/* Header Panel */}
      <div className="z-20 p-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-md">
            🛡️ Árbol de Destrezas
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {store.jobClass} • Tier {((store as any).tier ?? 'I')}
          </p>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/30 p-1.5 px-3 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="text-[9px] text-amber-300 font-black uppercase tracking-tighter">PUNTOS</span>
          <span className="text-lg font-mono font-black text-amber-200 leading-none">{store.skillPoints}</span>
        </div>
      </div>

      {/* Scalable Tree Area */}
      <div className="flex-1 overflow-auto bg-[#020408] relative scrollbar-none select-none">
        <div 
          className="relative mx-auto"
          style={{ 
            width: treeBounds.width, 
            height: treeBounds.height,
            padding: '50px' 
          }}
        >
          {/* SVG Connections Layer */}
          <svg 
            className="absolute inset-0 pointer-events-none z-0"
            width="100%" 
            height="100%"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {connections.map(conn => {
              const x1 = conn.x1 - treeBounds.offX;
              const y1 = conn.y1 - treeBounds.offY;
              const x2 = conn.x2 - treeBounds.offX;
              const y2 = conn.y2 - treeBounds.offY;
              
              return (
                <g key={conn.id}>
                  <line 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#1e293b" strokeWidth="3" strokeLinecap="round" 
                  />
                  {conn.isActive && (
                    <motion.line 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      x1={x1} y1={y1} x2={x2} y2={y2} 
                      stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round"
                      filter="url(#glow)"
                      className="opacity-80"
                    />
                  )}
                </g>
              );
            })}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#c026d3" />
            </linearGradient>
          </svg>

          {/* Skill Nodes Layer */}
          {availableSkills.map((skill) => {
            const isSelected = skill.id === selectedSkillId;
            const isUnlocked = skill.level > 0;
            const isMax = skill.level >= skill.maxLevel;
            const icon = SKILL_ICONS[skill.id] || (skill.name.substring(0, 2).toUpperCase());
            
            // Check requirements
            const deps = skill.dependencies || [];
            const isReqMet = deps.every(d => {
              const p = availableSkills.find(s => s.id === d.skillId);
              return p && p.level >= d.level;
            });

            const posX = (skill.x ?? 200) - treeBounds.offX;
            const posY = (skill.y ?? 0) - treeBounds.offY;

            return (
              <motion.div
                key={skill.id}
                className="absolute"
                style={{ left: posX, top: posY, transform: 'translate(-50%, -50%)' }}
                initial={false}
                animate={{ scale: isSelected ? 1.1 : 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedSkillId(isSelected ? null : skill.id);
                  triggerHaptic(8);
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Node Background / Shape */}
                  <div 
                    className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-indigo-600/40 to-purple-800/40 border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.2)]' 
                        : isReqMet 
                        ? 'bg-slate-900 border-slate-700 opacity-80' 
                        : 'bg-black border-slate-900 opacity-40 grayscale'
                    } ${isSelected ? 'ring-2 ring-white shadow-[0_0_25px_rgba(255,255,255,0.3)]' : ''}`}
                  >
                    <span className={`text-2xl filter drop-shadow-md select-none transition-transform duration-500 ${isUnlocked ? 'group-hover:scale-110' : ''}`}>
                      {icon}
                    </span>
                    
                    {/* Level Badge */}
                    <div className="absolute bottom-0 right-0 left-0 bg-black/60 border-t border-white/5 py-0.5 flex justify-center items-center">
                      <span className={`text-[9px] font-mono font-black tracking-tight ${isMax ? 'text-amber-400' : isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                        {skill.level}/{skill.maxLevel}
                      </span>
                    </div>

                    {!isUnlocked && !isReqMet && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[10px]">🔒</span>
                      </div>
                    )}
                  </div>

                  {/* Hotkey Indicator */}
                  {isUnlocked && !skill.isPassive && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-[#020408] flex items-center justify-center shadow-lg z-10">
                      <Zap className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                  {skill.isPassive && isUnlocked && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-lg border-2 border-[#020408] flex items-center justify-center shadow-lg z-10">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Node Name Label */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-24 text-center pointer-events-none">
                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none drop-shadow-md block ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                      {skill.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Detail Panel (Small screens optimized) */}
      <AnimatePresence>
        {!!selectedSkillId && selectedSkill && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 z-40 bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedSkillId(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white"
            >
              <CircleX className="w-5 h-5" />
            </button>

            <div className="flex gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 ${selectedSkill.level > 0 ? 'bg-indigo-600/30 border-indigo-400' : 'bg-slate-900 border-slate-700'}`}>
                {SKILL_ICONS[selectedSkill.id] || selectedSkill.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">{selectedSkill.name}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${selectedSkill.isPassive ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {selectedSkill.isPassive ? 'PASIVA' : 'ACTIVA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic">
                  "{selectedSkill.desc}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cost/CD Info */}
              {!selectedSkill.isPassive && (
                <div className="col-span-2 flex gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase">SP Cost</span>
                    <span className="text-xs font-mono font-black text-indigo-400">{selectedSkill.spCost}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase">Cooldown</span>
                    <span className="text-xs font-mono font-black text-indigo-400">{(selectedSkill.cooldown || 0) / 1000}s</span>
                  </div>
                  {selectedSkill.castTime ? (
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-slate-500 uppercase">Cast Time</span>
                      <span className="text-xs font-mono font-black text-indigo-400">{selectedSkill.castTime / 1000}s</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Requirements */}
              {(selectedSkill.dependencies?.length ?? 0) > 0 && (
                <div className="col-span-2 bg-red-500/5 border border-red-500/20 p-2 rounded-xl">
                  <span className="text-[7px] font-black text-red-400 uppercase tracking-widest block mb-1">Requisitos de Desbloqueo</span>
                  <div className="space-y-1">
                    {selectedSkill.dependencies?.map((dep, dIdx) => {
                      const depS = availableSkills.find(s => s.id === dep.skillId);
                      const isMet = depS && depS.level >= dep.level;
                      return (
                        <div key={dIdx} className="flex justify-between items-center text-[9px] font-bold">
                          <span className={isMet ? 'text-slate-300' : 'text-slate-500'}>
                            {depS?.name || dep.skillId} <span className="text-[8px]">Lv.{dep.level}</span>
                          </span>
                          <span className={isMet ? 'text-emerald-400' : 'text-red-500'}>{isMet ? 'Listo' : 'Falta'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button
                disabled={!hasPoints || selectedSkill.level >= selectedSkill.maxLevel}
                onClick={() => handleAllocate(selectedSkill.id)}
                className={`py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition-all shadow-lg ${
                  hasPoints && selectedSkill.level < selectedSkill.maxLevel
                    ? 'bg-amber-500 text-slate-950 active:scale-95'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                {selectedSkill.level >= selectedSkill.maxLevel ? 'Máximo' : `Mejorar (${store.skillPoints} PTS)`}
              </button>

              {!selectedSkill.isPassive && selectedSkill.level > 0 ? (
                <div className="flex gap-1.5">
                  {['Q', 'W', 'E', 'R'].map((label, idx) => {
                    const isAssigned = store.equippedSkills[idx] === selectedSkill.id;
                    return (
                      <button
                        key={label}
                        onClick={() => handleHotbarAssign(selectedSkill.id, idx)}
                        className={`flex-1 rounded-xl text-[10px] font-mono font-black border transition-all ${
                          isAssigned 
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900 rounded-2xl flex items-center justify-center text-[8px] font-bold text-slate-600 uppercase border border-slate-800">
                  {selectedSkill.isPassive ? 'Habilidad Pasiva' : 'No disponible'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info / Tip */}
      <div className="z-20 p-2 text-center bg-slate-950/40 border-t border-slate-900/50 shrink-0">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 leading-none mb-1">
          <Info className="w-2.5 h-2.5" /> Toca un nodo para ver detalles y gestionar tus puntos rúnicos
        </span>
        <div className="flex justify-center gap-4 py-1 pb-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[7px] text-slate-600 font-black uppercase">Mejorable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
            <span className="text-[7px] text-slate-600 font-black uppercase">Aprendida</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span className="text-[7px] text-slate-600 font-black uppercase">Bloqueada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

