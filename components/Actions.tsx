'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { Swords } from 'lucide-react';

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const SkillButton = ({ skill }: { skill: any }) => {
    // Placeholder for cooldown logic
    const isOnCooldown = false;

    return (
        <button 
            onClick={() => useGameStore.getState().castSkill(skill.id)}
            className="w-16 h-16 bg-slate-800 rounded-lg border-t-2 border-x-2 border-b-4 border-slate-700 shadow-md active:border-b-2 active:mt-0.5"
            style={{ backgroundColor: skill.color }}
        >
            {/* In a real implementation, you'd have an icon here */}
            <span className="font-bold text-white text-xs">{skill.name}</span>
        </button>
    );
};

export function Actions() {
    const store = useGameStore();

    return (
        <div className="flex items-end gap-4">
            {/* Main Action Buttons (Menu, etc) */}
            <div className="flex flex-col gap-2">
                 {/* This will be the main menu bar later */}
            </div>

            {/* Attack and Skills */}
            <div className="flex items-end gap-3">
                {/* Skill Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {store.skills.slice(0, 6).map(skill => (
                        <SkillButton key={skill.id} skill={skill} />
                    ))}
                </div>

                {/* Main Attack Button */}
                <button 
                    onClick={store.toggleAutoBattle} // Main action is now auto-battle toggle
                    className={cn(
                        "w-24 h-24 rounded-lg border-t-2 border-x-2 border-b-4 shadow-lg active:border-b-2 active:mt-0.5",
                        store.autoBattle 
                            ? "bg-red-700 border-red-900"
                            : "bg-slate-700 border-slate-900"
                    )}
                >
                    <Swords className="w-12 h-12 mx-auto text-white" />
                    <span className="font-bold text-white text-sm uppercase">Ataque</span>
                </button>
            </div>
        </div>
    );
}
