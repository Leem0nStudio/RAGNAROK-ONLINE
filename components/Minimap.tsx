'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X } from 'lucide-react';

export function Minimap({ player, monsters, mapName }: { player: { x: number, z: number }, monsters: { x: number, z: number }[], mapName?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapSize = 96;

  const displayMapName = (mapName || 'prontera').toUpperCase();
  const isLargeMap = mapName === 'prontera';
  const baseScale = isLargeMap ? 0.7 : 1.5;
  const expandedScale = isLargeMap ? 2.0 : 4.0;
  
  const renderMapContent = (size: number, scale: number) => (
    <>
      {/* Background */}
      <div className="absolute inset-0 bg-slate-800/30" />
      
      {/* Player Mark */}
      <motion.div 
        className="absolute w-2 h-2 bg-emerald-400 rounded-full border border-white z-10"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Entities & Portals */}
      {(() => {
        const portalPositions = mapName === 'prontera' 
          ? [{ x: 0, z: -78 }, { x: 0, z: 78 }, { x: 78, z: 0 }, { x: -78, z: 0 }]
          : mapName === 'prt_fild01' ? [{ x: 0, z: 47.5 }]
          : mapName === 'prt_fild02' ? [{ x: 0, z: -47.5 }]
          : mapName === 'prt_fild03' ? [{ x: -47.5, z: 0 }]
          : mapName === 'prt_fild04' ? [{ x: 47.5, z: 0 }]
          : [];

        return portalPositions.map((pos, idx) => {
          const dx = (pos.x - player.x) * scale;
          const dz = (pos.z - player.z) * scale;
          if (Math.abs(dx) < size / 2 && Math.abs(dz) < size / 2) {
            return (
              <motion.div
                key={`portal-${idx}`}
                className="absolute w-3 h-3 bg-sky-400 rounded-full border border-white z-0 shadow-[0_0_10px_#38bdf8]"
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                  left: `calc(50% + ${dx}px)`,
                  top: `calc(50% + ${dz}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          }
          return null;
        });
      })()}

      {/* Monsters */}
      {monsters.map((monster, i) => {
        const dx = (monster.x - player.x) * scale;
        const dz = (monster.z - player.z) * scale;
        
        if (Math.abs(dx) < size / 2 && Math.abs(dz) < size / 2) {
          return (
            <div 
              key={i}
              className="absolute w-1.5 h-1.5 bg-red-500 rounded-full"
              style={{
                left: `calc(50% + ${dx}px)`,
                top: `calc(50% + ${dz}px)`,
              }}
            />
          );
        }
        return null;
      })}
    </>
  );

  return (
    <>
      <div 
        className="relative w-24 h-24 rounded-full bg-slate-950/70 border border-slate-700/50 backdrop-blur-md overflow-hidden shadow-lg cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        {renderMapContent(96, baseScale)}
        <div className="absolute top-1 right-1 bg-slate-900/50 p-0.5 rounded-full">
            <Maximize2 className="w-3 h-3 text-white" />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg aspect-square bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-4 right-4 z-10 p-2 bg-slate-800 rounded-full text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                {renderMapContent(400, expandedScale)} {/* Larger scale map in modal */}
            </div>
            <p className="text-white mt-4 font-mono text-sm">{displayMapName} Area View</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
