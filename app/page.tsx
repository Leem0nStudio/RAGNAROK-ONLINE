'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useGameStore } from '@/lib/game/state';
import { RagnarokEngine } from '@/lib/game/engine';

// Core Layout Components
import { HUDLayout } from '@/components/HUDLayout';
import { RagnarokMenu } from '@/components/RagnarokMenu';

// HUD Components
import { CharacterPanel } from '@/components/CharacterPanel';
import { Minimap } from '@/components/Minimap';
import { Chat } from '@/components/Chat';
import { Actions } from '@/components/Actions';

// Floating UI Components
import { TargetHealthBar } from '@/components/TargetHealthBar';
import { ExperienceBars } from '@/components/ExperienceBars';
import { ResurrectionModal } from '@/components/ResurrectionModal';

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RagnarokEngine | null>(null);

  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

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
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold">Cargando Epicearth...</h2>
        </div>
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

      {/* Persistent HUD */}
      <HUDLayout 
        topLeft={<CharacterPanel />} 
        topRight={<Minimap />} 
        bottomLeft={<Chat />} 
        bottomRight={<Actions />}
      />

      {/* Main Menu / Character Sheet etc. */}
      <RagnarokMenu 
        isOpen={showCharacterSheet || store.showInventory} 
        onClose={() => {
          setShowCharacterSheet(false);
          if (store.showInventory) store.toggleInventory();
        }} 
        initialTab={showCharacterSheet ? 'status' : 'inventory'}
      />

      {/* Battle Mode Vignette */}
      <AnimatePresence>
        {store.battleMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 border-8 border-red-800/50 pointer-events-none rounded-2xl shadow-[inset_0_0_40px_rgba(153,27,27,0.5)]"
          />
        )}
      </AnimatePresence>

      {/* Target Health Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-none">
          <TargetHealthBar />
      </div>
      
      {/* Experience Bars */}
      <div className="absolute bottom-24 inset-x-4 z-10 pointer-events-none flex justify-center">
          <ExperienceBars />
      </div>

      {/* Resurrection Modal */}
      <ResurrectionModal onRevive={revivePlayer} />

    </div>
  );
}
