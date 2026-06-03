'use client';

import React, { useState } from 'react';
import { UIWindow } from '@/ui/UIWindow';
import { StatusPanel } from './StatusPanel';
import { InventoryPanel } from './InventoryPanel';
import { SkillsPanel } from './SkillsPanel';
import { QuestsPanel } from './QuestsPanel';
import { gameAudio } from '@/lib/game/audio';
import { colors, fontSizes, spacing } from '@/ui/theme';

interface RagnarokMenuProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'status' | 'inventory' | 'skills' | 'quests';
}

const TabButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <button
        onClick={() => { try { gameAudio.playUI(); } catch {} onClick(); }}
        className="font-bold transition-all duration-100 active:scale-95"
        style={{
            padding: `${spacing.xs}px ${spacing.lg}px`,
            fontSize: fontSizes.xs,
            backgroundColor: isActive ? colors.bg.ivory : colors.bg.parchment,
            color: isActive ? colors.text.nearBlack : colors.text.muted,
            borderBottom: isActive ? `2px solid ${colors.border.darkBrown}` : `2px solid transparent`,
        }}
    >
        {label}
    </button>
);

export function RagnarokMenu({ isOpen, onClose, initialTab = 'status' }: RagnarokMenuProps) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'status': return <StatusPanel />;
            case 'inventory': return <InventoryPanel />;
            case 'skills': return <SkillsPanel />;
            case 'quests': return <QuestsPanel />;
            default: return null;
        }
    };

    return (
        <UIWindow title="Menú del Aventurero" isOpen={isOpen} onClose={onClose} height="80vh" className="max-w-lg" draggable defaultPosition={{ x: 40, y: 40 }}>
            <div
                className="flex gap-2 px-4"
                style={{ backgroundColor: colors.bg.parchment }}
            >
                <TabButton label="Ficha" isActive={activeTab === 'status'} onClick={() => setActiveTab('status')} />
                <TabButton label="Inventario" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                <TabButton label="Habilidades" isActive={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
                <TabButton label="Misiones" isActive={activeTab === 'quests'} onClick={() => setActiveTab('quests')} />
            </div>
            <div className="flex-1" style={{ backgroundColor: colors.bg.ivory, color: colors.text.nearBlack }}>
                {renderActiveTab()}
            </div>
        </UIWindow>
    );
}
