'use client';

import { useEffect, useRef, useState } from 'react';
import { RagnarokEngine } from '@/lib/game/engine';
import { useGameStore } from '@/lib/game/state';

// Core Layout Components
import { HUDLayout } from '@/components/HUDLayout';
import { RagnarokMenu } from '@/components/RagnarokMenu';
import { ResurrectionModal } from '@/components/ResurrectionModal';

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RagnarokEngine | null>(null);
  
  const { showInventory, toggleInventory } = useGameStore();
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
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
        <h2 className="text-xl font-bold font-serif">Cargando Epicearth...</h2>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen select-none overflow-hidden bg-black font-sans">
      
      {/* 3D Canvas */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full z-0"
        id="game-canvas-3d"
      />

      {/* Main Game HUD */}
      <HUDLayout />

      {/* Fullscreen UI Menus */}
      <RagnarokMenu 
        isOpen={showCharacterSheet || showInventory} 
        onClose={() => {
          setShowCharacterSheet(false);
          if (showInventory) toggleInventory();
        }} 
        initialTab={showCharacterSheet ? 'status' : 'inventory'}
      />

      {/* Global Modals */}
      <ResurrectionModal onRevive={revivePlayer} />

    </div>
  );
}
