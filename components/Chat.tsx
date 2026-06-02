'use client';

import React from 'react';
import { useGameStore } from '@/lib/game/state';
import { MessageSquareText } from 'lucide-react';

export function Chat() {
    const { combatLogs, showCombatLog, toggleCombatLog } = useGameStore(state => ({
        combatLogs: state.combatLogs,
        showCombatLog: state.showCombatLog,
        toggleCombatLog: () => state.setState({ showCombatLog: !state.showCombatLog })
    }));

    return (
        <div className="w-80">
            {showCombatLog && (
                <div className="h-40 bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 border-t-2 border-x-2 border-b-4 border-slate-700 shadow-lg text-xs text-white font-mono overflow-y-auto mb-2">
                    {combatLogs.map((log) => (
                        <div key={log.id}>[{log.timestamp}] {log.text}</div>
                    ))}
                </div>
            )}
            <button 
                onClick={toggleCombatLog}
                className="w-14 h-14 bg-slate-800/80 rounded-lg border-t-2 border-x-2 border-b-4 border-slate-700 shadow-md flex items-center justify-center"
            >
                <MessageSquareText className="w-6 h-6 text-white" />
            </button>
        </div>
    );
}
