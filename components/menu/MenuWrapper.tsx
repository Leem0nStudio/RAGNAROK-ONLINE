'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, User, ShoppingBag, BookOpen } from 'lucide-react';

interface MenuWrapperProps {
  activeTab: 'status' | 'inventory' | 'skills';
  setActiveTab: (tab: 'status' | 'inventory' | 'skills') => void;
  onClose: () => void;
  children: React.ReactNode;
  skillPoints: number;
  triggerHaptic: (pattern: number | number[]) => void;
}

export const MenuWrapper = ({ 
  activeTab, 
  setActiveTab, 
  onClose, 
  children, 
  skillPoints, 
  triggerHaptic
}: MenuWrapperProps) => {
  // --- DYNAMIC TACTILE CONTAINER CLASSES ---
  let containerClass = "relative w-full h-[90vh] md:h-[820px] flex flex-col bg-slate-950/95 md:bg-slate-950/80 backdrop-blur-3xl border border-white/10 md:rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 ";
  
  if (activeTab === 'inventory') {
    containerClass += "max-w-[460px]"; 
  } else if (activeTab === 'status') {
    containerClass += "max-w-2xl";
  } else {
    containerClass += "max-w-4xl";
  }

  const viewportClass = "flex-1 overflow-hidden flex flex-col bg-[#0b0f1a]/40 md:rounded-3xl border-t border-white/5 ";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        className={containerClass}
        onClick={(e) => e.stopPropagation()}
        onPanEnd={(_, info) => {
          const threshold = 50;
          const tabs: ('status' | 'skills' | 'inventory')[] = ['status', 'skills', 'inventory'];
          const currentIndex = tabs.indexOf(activeTab);
          
          if (info.offset.x < -threshold) {
            // Swipe Left -> Next Tab
            const nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
            if (nextIndex !== currentIndex) {
              triggerHaptic(10);
              setActiveTab(tabs[nextIndex]);
            }
          } else if (info.offset.x > threshold) {
            // Swipe Right -> Previous Tab
            const prevIndex = Math.max(currentIndex - 1, 0);
            if (prevIndex !== currentIndex) {
              triggerHaptic(10);
              setActiveTab(tabs[prevIndex]);
            }
          }
        }}
      >
        {/* Header Bar */}
        <div className="flex-shrink-0 flex justify-between items-center bg-slate-950/40 px-5 py-4 border-b border-white/5 shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 md:w-11 md:h-11 border border-white/10 rounded-xl flex items-center justify-center text-lg select-none shadow-inner ${
                activeTab === 'inventory' ? 'bg-amber-600/20 text-amber-300' : activeTab === 'status' ? 'bg-indigo-600/20 text-indigo-300' : 'bg-cyan-600/20 text-cyan-300'
              }`}>
              {activeTab === 'inventory' ? <ShoppingBag className="w-5 h-5" /> : activeTab === 'status' ? <User className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className={`text-[11px] md:text-sm font-black uppercase tracking-[0.2em] font-mono leading-none ${
                activeTab === 'inventory' ? 'text-amber-300' : activeTab === 'status' ? 'text-indigo-300' : 'text-cyan-300'
              }`}>
                {activeTab === 'inventory' ? 'Inventario' : activeTab === 'status' ? 'Estado del Héroe' : 'Habilidades'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTab === 'inventory' ? 'bg-amber-400' : activeTab === 'status' ? 'bg-indigo-400' : 'bg-cyan-400'}`} />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                  {activeTab === 'inventory' ? 'Mochila y Equipamiento' : activeTab === 'status' ? 'Atributos y Estadísticas' : `Puntos Disponibles: ${skillPoints}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-900/60 border border-white/10 hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-500/20 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-95 group"
            title="Cerrar"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Main body viewport */}
        <div className={viewportClass}>
          {children}
        </div>

        {/* FLOATING NAVIGATION HUB */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-[320px] pointer-events-none md:hidden">
          <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] flex justify-between gap-1 pointer-events-auto">
            {(['status', 'skills', 'inventory'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const Icon = tab === 'status' ? User : tab === 'skills' ? BookOpen : ShoppingBag;
              const label = tab === 'status' ? 'Estado' : tab === 'skills' ? 'Habilidades' : 'Bolsa';
              const accentColor = tab === 'status' ? 'indigo' : tab === 'skills' ? 'cyan' : 'amber';
              
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (!isActive) {
                      triggerHaptic(12);
                      setActiveTab(tab);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all relative overflow-hidden group ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="tab-pill" 
                      className={`absolute inset-0 bg-linear-to-b from-${accentColor}-500/20 to-${accentColor}-700/30 rounded-xl border border-${accentColor}-400/30`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-90 opacity-60'}`} />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
