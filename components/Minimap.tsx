'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X } from 'lucide-react';

export function Minimap({ player, monsters, waypoints = [], mapName, regionName }: {
  player: { x: number, z: number };
  monsters: { x: number, z: number }[];
  waypoints?: { x: number, z: number }[];
  mapName?: string;
  regionName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapSize = 80;
  
  const renderMapContent = (size: number, scale: number) => (
    <>
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
      
      {/* Monsters */}
      {monsters.map((monster, i) => {
        const dx = (monster.x - player.x) * scale;
        const dz = (monster.z - player.z) * scale;
        
        if (Math.abs(dx) < size / 2 && Math.abs(dz) < size / 2) {
          return (
            <div 
              key={`m${i}`}
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

      {/* Quest Waypoints */}
      {waypoints.map((wp, i) => {
        const dx = (wp.x - player.x) * scale;
        const dz = (wp.z - player.z) * scale;
        
        if (Math.abs(dx) < size / 2 && Math.abs(dz) < size / 2) {
          return (
            <div 
              key={`wp${i}`}
              className="absolute w-2 h-2 bg-yellow-400 rounded-sm border border-yellow-600 animate-pulse"
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
        className="relative w-20 h-20 rounded-full bg-slate-950/70 border border-slate-700/50 backdrop-blur-md overflow-hidden shadow-lg cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        {renderMapContent(mapSize, 1.5)}
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
                {renderMapContent(400, 4)}
            </div>
            <p className="text-white mt-4 font-mono text-sm">{mapName ?? 'Prontera Area View'}{regionName ? ` — ${regionName}` : ''}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
