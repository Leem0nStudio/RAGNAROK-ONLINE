'use client';

import React, { useState } from 'react';
import { MenuWrapper } from './menu/MenuWrapper';
import { StatusScreen } from './menu/StatusScreen';
import { InventoryScreen } from './menu/InventoryScreen';
import { SkillsScreen } from './menu/SkillsScreen';
import { useGameStore } from '../lib/game/state';

interface RagnarokMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerHaptic: (pattern: number | number[]) => void;
  initialTab?: 'status' | 'inventory' | 'skills';
}

const RagnarokMenu = ({ isOpen, onClose, triggerHaptic, initialTab = 'status' }: RagnarokMenuProps) => {
  const [activeTab, setActiveTab] = useState<'status' | 'inventory' | 'skills'>(initialTab);
  const store = useGameStore();

  if (!isOpen) return null;

  return (
    <MenuWrapper
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onClose={onClose}
      triggerHaptic={triggerHaptic}
      skillPoints={store.skillPoints}
    >
      {activeTab === 'status' && <StatusScreen triggerHaptic={triggerHaptic} />}
      {activeTab === 'inventory' && (
        <InventoryScreen 
          triggerHaptic={triggerHaptic} 
          setActiveTab={setActiveTab} 
        />
      )}
      {activeTab === 'skills' && <SkillsScreen triggerHaptic={triggerHaptic} />}
    </MenuWrapper>
  );
};

export default RagnarokMenu;
