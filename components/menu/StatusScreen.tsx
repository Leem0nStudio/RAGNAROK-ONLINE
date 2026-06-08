'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Crown, Sliders, Wand2, Sparkles } from 'lucide-react';
import { useGameStore, JOB_TREE } from '../../lib/game/state';
import { JobClass } from '../../lib/game/types';
import { jobInfo, statTooltips, jobColors, defaultsForJob } from './constants';

interface StatusScreenProps {
  triggerHaptic: (pattern: number | number[]) => void;
}

export const StatusScreen = ({ triggerHaptic }: StatusScreenProps) => {
  const store = useGameStore();
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [allocModifier, setAllocModifier] = useState<'1' | '5' | '10' | 'MAX'>('1');

  const baseExpPercent = (store.playerBaseExp / store.playerBaseMaxExp) * 100;
  const jobExpPercent = (store.playerJobExp / store.playerJobMaxExp) * 100;

  const statsList = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
  const availablePoints = store.statPoints;

  const handleTactileIncrease = (statName: 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk') => {
    if (availablePoints <= 0) return;

    let pointsToSubmit = 1;
    if (allocModifier === '5') pointsToSubmit = 5;
    if (allocModifier === '10') pointsToSubmit = 10;
    if (allocModifier === 'MAX') pointsToSubmit = availablePoints;

    const actualPoints = Math.min(pointsToSubmit, availablePoints);
    if (actualPoints <= 0) return;

    triggerHaptic(12);

    for (let i = 0; i < actualPoints; i++) {
      store.allocateStatPoint(statName);
    }
  };

  const handleSmartAutoAssign = () => {
    if (availablePoints <= 0) return;

    let distribution: Record<string, number> = {};
    if (store.jobClass === 'Novice') {
      distribution = { str: 0.2, agi: 0.2, vit: 0.2, dex: 0.2, int: 0.1, luk: 0.1 };
    } else if (store.jobClass === 'Swordsman' || store.jobClass === 'Lord Knight') {
      distribution = { vit: 0.6, str: 0.4 };
    } else if (store.jobClass === 'Acolyte' || store.jobClass === 'High Priest') {
      distribution = { int: 0.7, dex: 0.3 };
    } else if (store.jobClass === 'Thief' || store.jobClass === 'Assassin Cross') {
      distribution = { agi: 0.6, luk: 0.4 };
    } else if (store.jobClass === 'Archer' || store.jobClass === 'Sniper') {
      distribution = { dex: 0.6, agi: 0.4 };
    }

    const nextBaseStats = { ...store.baseStats };
    let pointsSpent = 0;

    Object.entries(distribution).forEach(([statKey, ratio]) => {
      const shares = Math.floor(availablePoints * ratio);
      if (shares > 0) {
        nextBaseStats[statKey as keyof typeof nextBaseStats] += shares;
        pointsSpent += shares;

        if (statKey === 'vit') {
          useGameStore.setState({ currentHp: store.currentHp + (shares * 250) });
        }
        if (statKey === 'int') {
          useGameStore.setState({ currentSp: store.currentSp + (shares * 15) });
        }
      }
    });

    const remaining = availablePoints - pointsSpent;
    if (remaining > 0) {
      const primaryStat = Object.keys(distribution)[0];
      if (primaryStat) {
        nextBaseStats[primaryStat as keyof typeof nextBaseStats] += remaining;
        
        if (primaryStat === 'vit') {
          useGameStore.setState({ currentHp: store.currentHp + (remaining * 250) });
        }
        if (primaryStat === 'int') {
          useGameStore.setState({ currentSp: store.currentSp + (remaining * 15) });
        }
      }
    }

    useGameStore.setState({ baseStats: nextBaseStats });
    store.recalculateStats();
    triggerHaptic([15, 35, 15]);
    store.addCombatLog(`[Recomendador Inteligente] Distribuidos automáticamente ${availablePoints} puntos de atributos.`, 'system');
  };

  const handleResetPoints = () => {
    useGameStore.setState({ baseStats: defaultsForJob[store.jobClass] });
    store.recalculateStats();
    store.addCombatLog('Atributos reiniciados a los valores base de tu profesión.', 'system');
    triggerHaptic(30);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex flex-col pb-32 md:pb-6">
      {/* Character Profile Ribbon */}
      <div className={`p-4 rounded-3xl bg-linear-to-br ${jobColors[store.jobClass]} border-2 border-white/10 text-white relative shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] overflow-hidden shrink-0`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        {/* Job Switcher */}
        <button 
          onClick={() => setShowJobSelector(!showJobSelector)}
          className="absolute right-4 top-4 bg-slate-950/60 hover:bg-slate-900 border border-white/20 active:scale-95 transition-all rounded-xl px-3 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-md z-10"
        >
          Clase: <span className="text-amber-400 drop-shadow-md">{store.jobClass}</span> <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
        </button>

        <div className="flex items-center gap-4 relative z-10 pt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-white/5 to-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-5xl flex items-center justify-center shadow-lg">
            {jobInfo[store.jobClass].icon}
          </div>
          <div>
            <h3 className="font-display font-black text-xl tracking-widest uppercase text-shadow-md drop-shadow-lg mb-1">Héroe Rúnico</h3>
            <p className="text-[11px] text-white/90 font-mono font-black border border-white/20 bg-black/40 shadow-inner py-0.5 px-2 rounded-md inline-block uppercase tracking-wider backdrop-blur-md">
              BASE <span className="text-amber-300 mx-1">{store.stats.level}</span> | JOB <span className="text-amber-300 ml-1">{store.stats.jobLevel}</span>
            </p>
          </div>
        </div>

        {/* Exp Bars */}
        <div className="mt-5 space-y-2 relative z-10 border-t border-white/20 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-[10px] font-display font-black uppercase tracking-wider mb-1.5 text-shadow-md">
                <span className="text-cyan-300">Base Exp: {Math.round(baseExpPercent)}%</span>
                <span>{store.playerBaseExp.toLocaleString()} / {store.playerBaseMaxExp.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                <div 
                  className="h-full bg-linear-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)] relative transition-all duration-500" 
                  style={{ width: `${baseExpPercent}%` }}
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/25 rounded-t-full" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-display font-black uppercase tracking-wider mb-1.5 text-shadow-md">
                <span className="text-emerald-300">Job Exp: {Math.round(jobExpPercent)}%</span>
                <span>{store.playerJobExp.toLocaleString()} / {store.playerJobMaxExp.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                <div 
                  className="h-full bg-linear-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] relative transition-all duration-500" 
                  style={{ width: `${jobExpPercent}%` }}
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/25 rounded-t-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Selector overlay */}
      <AnimatePresence>
        {showJobSelector && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border border-slate-750 rounded-2xl p-4 space-y-3 shadow-2xl overflow-hidden shrink-0"
          >
            <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Cambiar Profesión Rúnica</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {JOB_TREE[store.jobClass].nextJobs.length > 0 ? (
                JOB_TREE[store.jobClass].nextJobs.map((k) => {
                  const j = jobInfo[k as JobClass];
                  const req = JOB_TREE[store.jobClass].requirement;
                  const meetsReq = store.stats.jobLevel >= req.jobLevel && (!req.baseLevel || store.stats.level >= req.baseLevel);
                  
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        if (!meetsReq) {
                          store.addCombatLog(`❌ Aún no cumples los requisitos para ser ${k}.`, 'system');
                          return;
                        }
                        store.setJobClass(k as JobClass);
                        setShowJobSelector(false);
                        triggerHaptic([10, 20]);
                      }}
                      className={`p-3.5 text-left border rounded-xl transition-all text-xs flex items-center justify-between active:scale-[0.98] ${
                        meetsReq
                          ? 'bg-slate-950/30 border-slate-700 text-slate-200 hover:border-indigo-500 hover:bg-indigo-950/20'
                          : 'bg-slate-900/50 border-slate-850 text-slate-600 grayscale'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{j.icon}</span>
                        <div>
                          <span className="font-extrabold block">{j.name}</span>
                          <span className="text-[10px] block font-normal opacity-70">
                            {meetsReq ? j.role : `Requi: Job Lv ${req.jobLevel}`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-6 text-center space-y-3">
                  <Crown className="w-8 h-8 text-amber-500 mx-auto" />
                  <div>
                      <p className="text-sm font-black text-slate-200 uppercase">Has alcanzado el límite de esta rama</p>
                      <p className="text-xs text-slate-400">¡Busca el poder del renacimiento al llegar a Nivel 99!</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Allocation */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="col-span-1 md:col-span-7 space-y-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-lg">
            <div className="w-full sm:w-auto text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-black uppercase text-indigo-300 tracking-widest">Asignador</span>
              </div>
              {availablePoints > 0 ? (
                <span className="text-[12px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-black block mx-auto sm:mx-0 w-fit animate-pulse">
                  {availablePoints} PUNTOS DISPONIBLES
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">Agotado</span>
              )}
            </div>

            <div className="flex gap-2 bg-slate-950/80 border border-slate-700/50 p-1.5 rounded-xl w-full sm:w-auto shrink-0 justify-around shadow-inner">
              {(['1', '5', '10', 'MAX'] as const).map((mod) => (
                <button
                  key={mod}
                  onClick={() => setAllocModifier(mod)}
                  className={`py-2 px-3 sm:px-4 text-[13px] font-black rounded-lg transition-all border ${
                    allocModifier === mod 
                      ? 'bg-indigo-600 border-indigo-400 text-white min-w-[48px] shadow-lg' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {mod === 'MAX' ? 'MAX' : `+${mod}`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {statsList.map((stat) => {
              const baseVal = store.baseStats[stat];
              const totalVal = store.stats[stat];
              const bonus = totalVal - baseVal;
              const spec = statTooltips[stat];

              return (
                <div key={stat} className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-all shadow-md group relative overflow-hidden">
                  <div className="min-w-0 flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-black text-[15px] text-white uppercase tracking-widest">{stat}</span>
                      <span className="text-[10px] bg-slate-800/80 border border-slate-700 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {spec.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight font-medium truncate">{spec.desc}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 relative z-10">
                    <div className="p-2.5 px-4 bg-slate-950/80 rounded-xl font-display text-center border border-slate-800 min-w-[70px] shadow-inner">
                      <span className="text-[17px] font-black text-white">{baseVal}</span>
                      {bonus > 0 && <span className="text-cyan-400 text-[13px] ml-1 font-black">+{bonus}</span>}
                    </div>
                    
                    <button
                      onClick={() => handleTactileIncrease(stat)}
                      disabled={availablePoints <= 0}
                      className={`w-[50px] h-[50px] rounded-[14px] flex items-center justify-center transition-all font-display font-black text-2xl active:scale-95 border-2 ${
                        availablePoints > 0 
                          ? 'bg-linear-to-b from-indigo-500 to-indigo-700 text-white shadow-lg border-indigo-400 hover:brightness-110' 
                          : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-1 md:col-span-5 space-y-4">
          <div className="bg-slate-900/60 backdrop-blur-md border-[2px] border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <span className="text-[13px] font-black uppercase text-emerald-300 tracking-widest">Acciones Rápidas</span>
            </div>

            {availablePoints > 0 ? (
              <button
                onClick={handleSmartAutoAssign}
                className="w-full py-4 px-4 bg-linear-to-b from-emerald-500 to-emerald-700 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg border-2 border-emerald-400/80"
              >
                <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
                <span>Distribución Sugerida</span>
              </button>
            ) : (
              <div className="p-3 text-[11px] text-slate-500 bg-slate-950/50 border border-slate-800/50 rounded-xl text-center font-bold uppercase tracking-wider">
                Build Consolidada
              </div>
            )}

            <button
              onClick={handleResetPoints}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 active:scale-[0.98] transition-all text-slate-400 hover:text-slate-200 text-[11px] font-black rounded-xl flex items-center justify-center gap-2 border border-slate-800 shadow-inner"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              RESETEAR ATRIBUTOS (GRATIS)
            </button>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 space-y-3 shadow-lg">
            <span className="text-[11px] font-black uppercase text-indigo-300 tracking-wider block">Propiedades de Combate</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '⚔️ ATK', val: store.stats.atk },
                { label: '🛡️ DEF', val: store.stats.def },
                { label: '🎯 HIT', val: store.stats.hit },
                { label: '💨 FLEE', val: store.stats.flee },
                { label: '⚡ ASPD', val: store.stats.aspd },
              ].map((statDef, i) => (
                <div key={i} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl shadow-inner">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{statDef.label}</span>
                  <span className="text-base font-display font-black text-white block mt-0.5">{statDef.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
