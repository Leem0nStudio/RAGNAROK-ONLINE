'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';

const StatBar = ({ value, maxValue, colorClass, label }: { value: number; maxValue: number; colorClass: string; label: string; }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-mono text-xs font-bold text-white">{label}</span>
        <span className="font-mono text-xs font-bold text-white">
          {Math.floor(value)}/{maxValue}
        </span>
      </div>
      <div className="h-3 bg-black/50 rounded-sm border border-black/30 overflow-hidden shadow-inner">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export function CharacterPanel() {
  const store = useGameStore();
  const hpPercent = (store.currentHp / store.stats.maxHp) * 100;
  const spPercent = (store.currentSp / store.stats.maxSp) * 100;

  return (
    <div 
      className="w-60 bg-slate-800/80 backdrop-blur-sm p-2 rounded-lg border-t-2 border-x-2 border-b-4 border-slate-700 shadow-lg"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      <div className="flex items-center space-x-2">
        {/* Portrait */}
        <div className="w-12 h-12 bg-slate-900 rounded-md border-2 border-slate-600 flex items-center justify-center">
          {/* Placeholder for character portrait image */}
          <span className="text-3xl">🧐</span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="font-bold text-white text-sm mb-1">
            <span>Base Lvl {store.stats.level} / </span>
            <span>Job Lvl {store.stats.jobLevel}</span>
          </div>
          <div className="space-y-1">
            <StatBar value={store.currentHp} maxValue={store.stats.maxHp} colorClass="bg-red-600" label="HP" />
            <StatBar value={store.currentSp} maxValue={store.stats.maxSp} colorClass="bg-blue-600" label="SP" />
          </div>
        </div>
      </div>
    </div>
  );
}
