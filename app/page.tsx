'use client';

import { useEffect, useRef, useState } from 'react';
import { RagnarokEngine } from '@/lib/game/engine';
import { useWindowManager } from '@/lib/game/windowManager';

// Core Layout Components
import { HUDLayout } from '@/components/HUDLayout';
import { ResurrectionModal } from '@/components/ResurrectionModal';

// Individual Windows
import { InventoryWindow } from '@/components/windows/InventoryWindow';
import { SkillsWindow } from '@/components/windows/SkillsWindow';
import { EquipmentWindow } from '@/components/windows/EquipmentWindow';
import { QuestWindow } from '@/components/windows/QuestWindow';
import { ShopWindow } from '@/components/windows/ShopWindow';
import { StatusWindow } from '@/components/windows/StatusWindow';

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RagnarokEngine | null>(null);
  const wm = useWindowManager();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const engine = new RagnarokEngine(containerRef.current);
    engineRef.current = engine;
    
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [mounted]);

  const revivePlayer = () => {
    engineRef.current?.revivePlayer();
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <h2 className="text-name font-bold font-sans">Cargando Epicearth...</h2>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen select-none overflow-hidden bg-black font-sans">
      
      {/* 3D Canvas */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full z-world"
        id="game-canvas-3d"
      />

      {/* Main Game HUD */}
      <HUDLayout />

      {/* All Windows — managed by windowManager */}
      <InventoryWindow />
      <SkillsWindow />
      <EquipmentWindow />
      <QuestWindow />
      <ShopWindow />
      <StatusWindow />

      {/* Global Modals */}
      <ResurrectionModal onRevive={revivePlayer} />

    </div>
  );
}
