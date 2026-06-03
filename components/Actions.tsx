'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { useWindowManager } from '@/lib/game/windowManager';
import { Swords, Backpack, Settings, User } from 'lucide-react';
import { colors, fontSizes, hudOpacity } from '@/ui/theme';
import { playUI } from '@/lib/game/audio';
import { useButtonState } from '@/ui/buttonState';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Actions() {
    const store = useGameStore();
    const wm = useWindowManager();
    const atq = useButtonState();
    const inv = useButtonState();
    const sett = useButtonState();
    const stats = useButtonState();

    return (
        <div className="flex flex-col gap-1.5">
            {/* Main Attack Button */}
            <button
                onClick={() => { playUI(); store.toggleAutoBattle(); }}
                onPointerDown={playUI}
                onMouseEnter={atq.onMouseEnter}
                onMouseLeave={atq.onMouseLeave}
                className={cn(
                    "flex flex-col items-center justify-center transition-all duration-100 active:scale-95",
                    store.autoBattle && "animate-pulse"
                )}
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    opacity: hudOpacity.critical,
                    backgroundColor: store.autoBattle ? colors.hp : colors.btnBg,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: store.autoBattle ? colors.accentReddark : colors.borderBtn,
                    borderBottomWidth: 3,
                    boxShadow: store.autoBattle
                        ? `0 0 8px ${colors.hpSoft}`
                        : `0 2px 4px ${colors.overlayDark}`,
                    filter: atq.hovered ? 'brightness(1.15)' : 'none',
                }}
            >
                <Swords size={18} className="text-white" />
                <span className="text-white font-bold uppercase leading-tight mt-0.5" style={{ fontSize: fontSizes.secondary }}>
                    Atq
                </span>
            </button>

            {/* Utility buttons row */}
            <div className="flex gap-1.5" style={{ opacity: hudOpacity.primary }}>
                <button
                    onClick={() => { playUI(); wm.open('inventory'); }}
                    onPointerDown={playUI}
                    onMouseEnter={inv.onMouseEnter}
                    onMouseLeave={inv.onMouseLeave}
                    className="flex items-center justify-center transition-all duration-100 active:scale-95"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        backgroundColor: colors.btnBgSoft,
                        border: `1px solid ${colors.borderGrayLight}`,
                        filter: inv.hovered ? 'brightness(1.15)' : 'none',
                    }}
                >
                    <Backpack size={16} className="text-white" />
                </button>
                <button
                    onClick={() => { playUI(); wm.toggle('status'); }}
                    onPointerDown={playUI}
                    onMouseEnter={stats.onMouseEnter}
                    onMouseLeave={stats.onMouseLeave}
                    className="flex items-center justify-center transition-all duration-100 active:scale-95"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        backgroundColor: colors.btnBgSoft,
                        border: `1px solid ${colors.borderGrayLight}`,
                        filter: stats.hovered ? 'brightness(1.15)' : 'none',
                    }}
                >
                    <User size={16} className="text-white" />
                </button>
                <button
                    onClick={() => { playUI(); wm.toggle('equipment'); }}
                    onPointerDown={playUI}
                    onMouseEnter={sett.onMouseEnter}
                    onMouseLeave={sett.onMouseLeave}
                    className="flex items-center justify-center transition-all duration-100 active:scale-95"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        backgroundColor: colors.btnBgSoft,
                        border: `1px solid ${colors.borderGrayLight}`,
                        filter: sett.hovered ? 'brightness(1.15)' : 'none',
                    }}
                >
                    <Settings size={16} className="text-white" />
                </button>
            </div>
        </div>
    );
}
