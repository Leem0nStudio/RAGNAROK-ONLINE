'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Shield, Swords, Sparkles, Heart, Zap, Coins,
  Settings, RefreshCw, Eye, Info, Layers, 
  AlertTriangle, Play, FastForward, Pocket, HelpCircle, ShoppingBag, MessageSquareText,
  Wind, Bug, Bird, Leaf
} from 'lucide-react';

import { useGameStore } from '../lib/game/state';
import { ITEM_DATABASE } from '../lib/game/inventory';
import { RagnarokEngine } from '../lib/game/engine';
import { JobClass, HeadgearId } from '../lib/game/types';
import { Minimap } from '../components/Minimap';
import { RagnarokMenu } from '../components/RagnarokMenu';
import { gameAudio } from '../lib/game/audio';

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RagnarokEngine | null>(null);

  // Stats and state
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [fps, setFps] = useState(60);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'controls' | 'report'>('controls');
  const [showSaved, setShowSaved] = useState(false);
  
  // Unified menu state for easier keyboard control
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    tab: 'inventory' | 'skills' | 'status';
  }>({
    isOpen: false,
    tab: 'inventory'
  });

  const [ambientConfig, setAmbientConfig] = useState({
    butterflies: true,
    birds: true,
    leaves: true,
    fireflies: true,
    dust: true,
    windSpeed: 1.0,
    windForce: 1.0
  });

  const [isBreezing, setIsBreezing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // States for hotbar skill reordering and long press interaction
  const [activeReorderMenu, setActiveReorderMenu] = useState<number | null>(null);
  const reorderLongPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressActive, setIsLongPressActive] = useState<boolean>(false);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).ambientLife = ambientConfig;
    }
  }, [ambientConfig]);

  const triggerBreeze = () => {
    if (isBreezing) return;
    setIsBreezing(true);
    gameAudio.playWindWhoosh();

    setAmbientConfig(prev => ({
      ...prev,
      windSpeed: 3.5,
      windForce: 3.0
    }));

    let steps = 0;
    const interval = setInterval(() => {
      steps++;
      setAmbientConfig(prev => {
        const nextSpeed = Math.max(1.0, prev.windSpeed - 0.25);
        const nextForce = Math.max(1.0, prev.windForce - 0.2);
        return {
          ...prev,
          windSpeed: nextSpeed,
          windForce: nextForce
        };
      });
      if (steps >= 10) {
        clearInterval(interval);
        setIsBreezing(false);
      }
    }, 180);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    const text = chatInput.trim();
    setChatInput('');
    chatInputRef.current?.blur();

    // Process commands
    if (text.toLowerCase() === 'vivir de nuevo' || text.toLowerCase() === '/revive') {
      if (store.currentHp <= 0 && engineRef.current) {
        engineRef.current.revivePlayer();
      }
      return;
    }

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      if (cmd === '/job' && parts[1]) {
        store.setJobClass(parts[1] as any);
        store.addCombatLog(`Comando: Clase cambiada a ${parts[1]}`, 'system');
      } else if (cmd === '/addexp' && parts[1]) {
        store.addExp(parseInt(parts[1]), 0);
      } else {
        store.addCombatLog(`Comando desconocido: ${cmd}`, 'system');
      }
      return;
    }

    // Standard message
    store.addCombatLog(`[Tú]: ${text}`, 'system');
  };

  // 3. KEYBOARD EVENT LISTENERS (QWER Hotbar & Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && document.activeElement === chatInputRef.current) {
          handleChatSubmit();
        }
        if (e.key === 'Escape') {
          chatInputRef.current?.blur();
        }
        return;
      }

      const key = e.key.toLowerCase();
      
      // HOTBAR SKILLS: Q, W, E, R
      if (['q', 'w', 'e', 'r'].includes(key)) {
        const index = ['q', 'w', 'e', 'r'].indexOf(key);
        const skillId = store.equippedSkills[index];
        if (skillId) {
          store.castSkill(skillId);
          // Visual feedback on the bubble
          const bubble = document.getElementById(`skill-bubble-${skillId}`);
          if (bubble) {
            bubble.classList.add('scale-90');
            setTimeout(() => bubble.classList.remove('scale-90'), 100);
          }
        }
      }

      // MANUAL ATTACK SHORTCUT: Spacebar
      if (e.key === ' ') {
        if (engineRef.current) {
          engineRef.current.triggerManualAttack();
          e.preventDefault();
        }
      }

      // POTION SHORTCUT: F
      if (key === 'f') {
        store.drinkPotion();
      }

      // UI SHORTCUTS
      if (key === 'i' || key === 'b') {
        setMenuState(prev => prev.isOpen && prev.tab === 'inventory' ? { ...prev, isOpen: false } : { isOpen: true, tab: 'inventory' });
      }
      if (key === 'k' || key === 's') {
        setMenuState(prev => prev.isOpen && prev.tab === 'skills' ? { ...prev, isOpen: false } : { isOpen: true, tab: 'skills' });
      }
      if (key === 'c') {
        setMenuState(prev => prev.isOpen && prev.tab === 'status' ? { ...prev, isOpen: false } : { isOpen: true, tab: 'status' });
      }
      
      // CHAT FOCUS: Enter
      if (e.key === 'Enter') {
        chatInputRef.current?.focus();
        e.preventDefault();
      }

      // CLOSE MENU: Escape
      if (e.key === 'Escape') {
        if (menuState.isOpen) {
          setMenuState(prev => ({ ...prev, isOpen: false }));
        } else if (store.npcDialogue) {
          store.closeNpcDialogue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.equippedSkills, store.skills, menuState.isOpen, store.npcDialogue]);

  // High-precision animation timer frame ticker (drives ultra-smooth radial cooldown covers)
  const [minimapData, setMinimapData] = useState({ player: { x: 0, z: 0 }, monsters: [] as { x: number, z: number }[] });

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      setCurrentTime(performance.now());
      if (engineRef.current) {
        setMinimapData(engineRef.current.getMinimapData());
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, []);

  // Performance FPS reader on client side
  useEffect(() => {
    setMounted(true);
    let frames = 0;
    let prevTime = performance.now();

    const calcFps = () => {
      const time = performance.now();
      frames++;
      if (time > prevTime + 1000) {
        setFps(Math.round((frames * 1000) / (time - prevTime)));
        frames = 0;
        prevTime = time;
      }
      requestAnimationFrame(calcFps);
    };
    const animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize Three.js Engine once container is ready
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Build core ragnarok touch engine!
    const engine = new RagnarokEngine(containerRef.current);
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [mounted]);

  // Synchronize Job stats in engine when switched in UI
  useEffect(() => {
    // If job class changes, reset or update billboards implicitly
    if (engineRef.current) {
      // Nothing needed, the continuous frame tick automatically rebuilds texture map on change
    }
  }, [store.jobClass, store.headgear]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-white">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 stroke-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-display font-medium text-slate-100 tracking-tight">Cargando Prontera Sandbox...</h2>
          <p className="text-sm font-mono text-slate-400 mt-2">Iniciando shaders y buffers de vectores...</p>
        </div>
      </div>
    );
  }

  const jobColors: Record<JobClass, string> = {
    'Novice': 'from-slate-500 to-slate-700',
    'Swordsman': 'from-orange-550 to-red-650',
    'Mage': 'from-indigo-500 to-purple-600',
    'Acolyte': 'from-teal-550 to-emerald-650',
    'Thief': 'from-purple-550 to-violet-750',
    'Archer': 'from-cyan-550 to-sky-700',
    'Merchant': 'from-yellow-600 to-amber-800',
    'Knight': 'from-orange-600 to-red-600',
    'Crusader': 'from-yellow-500 to-orange-500',
    'Wizard': 'from-indigo-700 to-violet-800',
    'Sage': 'from-amber-600 to-orange-700',
    'Hunter': 'from-blue-600 to-cyan-700',
    'Bard': 'from-emerald-500 to-teal-700',
    'Dancer': 'from-rose-500 to-pink-700',
    'Priest': 'from-sky-400 to-blue-600',
    'Monk': 'from-stone-500 to-stone-700',
    'Blacksmith': 'from-zinc-600 to-zinc-900',
    'Alchemist': 'from-lime-600 to-green-700',
    'Assassin': 'from-purple-800 to-black',
    'Rogue': 'from-slate-700 to-stone-900',
    'Lord Knight': 'from-rose-500 to-red-700',
    'Paladin': 'from-yellow-400 to-amber-600',
    'High Wizard': 'from-purple-500 to-indigo-900',
    'Professor': 'from-amber-500 to-orange-800',
    'Sniper': 'from-sky-400 to-cyan-700',
    'Clown': 'from-emerald-400 to-teal-600',
    'Gypsy': 'from-rose-400 to-pink-600',
    'High Priest': 'from-emerald-400 to-teal-700',
    'Champion': 'from-stone-400 to-stone-600',
    'Whitesmith': 'from-orange-400 to-zinc-800',
    'Creator': 'from-lime-500 to-green-600',
    'Assassin Cross': 'from-fuchsia-500 to-purple-800',
    'Stalker': 'from-slate-600 to-stone-800'
  };

  const jobAura: Record<JobClass, string> = {
    'Novice': 'shadow-slate-500/20 border-slate-500/30',
    'Swordsman': 'shadow-orange-500/20 border-orange-550/40',
    'Mage': 'shadow-indigo-500/20 border-indigo-500/30',
    'Acolyte': 'shadow-teal-500/20 border-teal-550/40',
    'Thief': 'shadow-purple-550/20 border-purple-550/40',
    'Archer': 'shadow-cyan-550/20 border-cyan-550/30',
    'Merchant': 'shadow-yellow-600/20 border-yellow-600/40',
    'Knight': 'shadow-orange-600/30 border-orange-600/40',
    'Crusader': 'shadow-yellow-500/30 border-yellow-500/40',
    'Wizard': 'shadow-indigo-700/30 border-indigo-700/40',
    'Sage': 'shadow-amber-600/30 border-amber-600/40',
    'Hunter': 'shadow-blue-600/30 border-blue-600/40',
    'Bard': 'shadow-emerald-500/30 border-emerald-500/40',
    'Dancer': 'shadow-rose-500/30 border-rose-500/40',
    'Priest': 'shadow-sky-400/20 border-sky-400/40',
    'Monk': 'shadow-stone-500/30 border-stone-500/40',
    'Blacksmith': 'shadow-zinc-600/20 border-zinc-600/40',
    'Alchemist': 'shadow-lime-600/30 border-lime-600/40',
    'Assassin': 'shadow-purple-800/20 border-purple-800/40',
    'Rogue': 'shadow-slate-700/30 border-slate-700/40',
    'Lord Knight': 'shadow-rose-500/20 border-rose-500/40',
    'Paladin': 'shadow-yellow-400/20 border-yellow-400/40',
    'High Wizard': 'shadow-purple-500/20 border-purple-500/40',
    'Professor': 'shadow-amber-500/20 border-amber-500/40',
    'Sniper': 'shadow-sky-500/20 border-sky-500/30',
    'Clown': 'shadow-emerald-400/20 border-emerald-400/40',
    'Gypsy': 'shadow-rose-400/20 border-rose-400/40',
    'High Priest': 'shadow-emerald-500/20 border-emerald-500/40',
    'Champion': 'shadow-stone-400/20 border-stone-400/40',
    'Whitesmith': 'shadow-orange-400/20 border-orange-400/40',
    'Creator': 'shadow-lime-500/20 border-lime-500/40',
    'Assassin Cross': 'shadow-fuchsia-500/20 border-fuchsia-500/40',
    'Stalker': 'shadow-slate-600/20 border-slate-600/40'
  };

  const hpPercent = (store.currentHp / store.stats.maxHp) * 100;
  const spPercent = (store.currentSp / store.stats.maxSp) * 100;
  const baseExpPercent = (store.playerBaseExp / store.playerBaseMaxExp) * 100;
  const jobExpPercent = (store.playerJobExp / store.playerJobMaxExp) * 100;

  return (
    <div className="relative w-full h-screen select-none overflow-hidden bg-[#020617] font-sans">
      
      {/* 1. THREE JS CENTRAL CONTAINER */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
        id="game-canvas-3d"
      />

      <RagnarokMenu 
        isOpen={menuState.isOpen} 
        onClose={() => setMenuState(prev => ({ ...prev, isOpen: false }))} 
        initialTab={menuState.tab}
      />

      {/* 1.1. BATTLE MODE DANGER PULSING VIGNETTE */}
      <AnimatePresence>
        {store.battleMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-[10px] sm:inset-[20px] z-[1] border-[10px] sm:border-[16px] border-red-600/15 pointer-events-none select-none rounded-[1.6rem] sm:rounded-[2.2rem] shadow-[inset_0_0_60px_rgba(220,38,38,0.3)]"
          />
        )}
      </AnimatePresence>

      {/* 1.2. DYNAMIC ATTACK IMPACT FLASH */}
      <AnimatePresence>
        {store.playerAttackPulse > 0 && (
          <motion.div
            key={`attack-pulse-${store.playerAttackPulse}`}
            initial={{ opacity: 0.8, scale: 1.05 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-[10px] sm:inset-[20px] z-[2] border-4 sm:border-8 border-white/60 pointer-events-none select-none rounded-[1.6rem] sm:rounded-[2.2rem] shadow-[inset_0_0_80px_rgba(255,255,255,0.4)]"
          />
        )}
      </AnimatePresence>

      {/* VIRTUAL JOYSTICK POSITION INDICATOR (Dynamic absolute placement during drag) */}
      {store.isJoystickEnabled && store.joystick.isActive && (
        <div 
          className="absolute z-10 pointer-events-none flex items-center justify-center mix-blend-screen"
          style={{
            left: `${store.joystick.startX - 60}px`,
            top: `${store.joystick.startY - 60}px`,
            width: '120px',
            height: '120px'
          }}
        >
          {/* Base ring - Dimmer base for better immersion */}
          <div className="absolute w-full h-full rounded-full border border-sky-400/15 bg-black/10 backdrop-blur-md" />
          
          {/* Active Knob Ring - Glowing Magic */}
          <div 
            className="absolute rounded-full flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${Math.cos(store.joystick.angle) * store.joystick.distance}px, ${Math.sin(store.joystick.angle) * store.joystick.distance}px)`
            }}
          >
            {/* Trail / Core */}
            <div className="absolute w-14 h-14 rounded-full bg-linear-to-tr from-sky-400 to-indigo-500 opacity-60 blur-md animate-pulse" />
            <div className="absolute w-10 h-10 rounded-full bg-white/20 border-2 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>
        </div>
      )}

      {/* 2. DYNAMIC TARGET MOB HEALTH STATUS BAR (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {store.targetEntityId && (
            <motion.div 
              initial={{ opacity: 0, y: -45, scale: 0.85, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -45, scale: 0.85, rotateX: 15 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="relative bg-slate-950/90 backdrop-blur-2xl border border-red-500/40 rounded-2xl p-3.5 shadow-[0_12px_40px_rgba(239,68,68,0.25),inset_0_1px_2px_rgba(255,255,255,0.15)] flex items-center space-x-3.5 pointer-events-auto overflow-hidden group"
              id="mob-target-banner"
            >
              {/* Inner scanning laser sweeping sheen */}
              <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-transparent via-red-500/10 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[400%] transition-transform duration-1000 pointer-events-none" />

              {/* Glowing Corner Accents */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500/60 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500/60 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500/60 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500/60 rounded-br-sm" />

              {/* Target Class Logo with high-intensity spinning entry */}
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.04, type: 'spring', stiffness: 300, damping: 14 }}
                className="relative w-13 h-13 rounded-xl bg-linear-to-b from-red-950 to-slate-950 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.25),inset_0_2px_8px_rgba(0,0,0,0.8)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-t from-red-600/30 to-transparent" />
                <div className="absolute inset-0 bg-red-500/15 animate-pulse mix-blend-overlay" />
                <Swords className="w-6.5 h-6.5 stroke-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.85)] relative z-10" />
                
                {/* Haptic strike flash */}
                <AnimatePresence>
                  {store.playerAttackPulse > 0 && (
                    <motion.div 
                      key={`hit-${store.playerAttackPulse}`}
                      initial={{ opacity: 1, scale: 1.4 }}
                      animate={{ opacity: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 bg-white z-20 mix-blend-overlay"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Title & Bars with entry animations */}
              <div className="flex-1 min-w-0 pr-1 select-none">
                <div className="flex justify-between items-center mb-1.5 gap-2">
                  <motion.div
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.08, duration: 0.25 }}
                    className="flex flex-col min-w-0"
                  >
                    <span className="font-display font-black text-sm text-red-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider truncate uppercase">
                      {store.targetName}
                    </span>
                    <span className="font-mono text-[9px] text-red-400/80 font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                      TARGET ACQUIRED
                    </span>
                  </motion.div>
                  
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="font-mono text-xs text-red-200 font-bold shrink-0 bg-red-950/70 px-2.5 py-0.5 rounded-md border border-red-500/25 shadow-[inset_0_1px_5px_rgba(0,0,0,0.5)] flex items-center justify-center gap-1"
                  >
                    <span className="text-[10px] text-red-400 font-black">HP</span>
                    <span>{store.targetHp}</span>
                    <span className="text-red-500/50 font-normal">/</span>
                    <span className="text-red-400">{store.targetMaxHp}</span>
                  </motion.span>
                </div>
                
                {/* Hp bar */}
                <div className="w-full h-3.5 bg-slate-950/80 rounded-md overflow-hidden border border-slate-800 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)] p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, (store.targetHp / store.targetMaxHp) * 100))}%` }}
                    transition={{ type: 'spring', stiffness: 90, damping: 14 }}
                    className="h-full rounded-sm bg-linear-to-r from-red-700 via-rose-500 to-red-400 shadow-[0_0_12px_rgba(244,63,94,0.7)] relative overflow-hidden"
                  >
                    {/* Gloss / shine reflection overlay */}
                    <div className="absolute top-0 inset-x-0 h-[40%] bg-white/20 rounded-t-sm" />
                    {/* Animated diagonal pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:12px_12px] opacity-25" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2.7. COMBO COUNTER UI (Floating Right) */}
      <AnimatePresence>
        {store.comboCount > 1 && (Date.now() - store.comboTimer < 3000) && (
          <motion.div
            key={`combo-${store.comboCount}`}
            initial={{ opacity: 0, x: 100, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            className="absolute top-1/2 right-6 sm:right-12 -translate-y-[120%] z-20 flex flex-col items-end pointer-events-none select-none"
          >
            <motion.div 
               animate={{ scale: [1, 1.25, 1] }}
               transition={{ duration: 0.2, type: 'spring' }}
               className="flex flex-col items-end"
            >
              <div className="font-display font-black text-6xl sm:text-8xl text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] leading-none italic tracking-tighter">
                {store.comboCount}
              </div>
              <div className="font-display font-black text-xl sm:text-2xl text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] tracking-[0.2em] mt-[-8px] sm:mt-[-12px] uppercase">
                Combos!!
              </div>
            </motion.div>
            
            {/* Combo timer bar decay visual */}
            <div className="w-24 sm:w-40 h-1 sm:h-1.5 bg-slate-900/60 mt-2 sm:mt-3 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
               <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-linear-to-r from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.5. VISUAL PICKUP NOTIFICATIONS FEED (Side Toasts) */}
      <div className="absolute top-[280px] left-3 sm:left-4 z-40 flex flex-col space-y-2 pointer-events-none max-w-[200px] sm:max-w-xs" id="pickup-toasts-feed">
        <AnimatePresence>
          {store.pickupNotifications.map((notif) => {
            const borderColors = {
              common: 'border-slate-700/60 shadow-slate-900/40 bg-slate-950/85 text-slate-200',
              rare: 'border-sky-500/50 shadow-sky-500/10 bg-slate-950/90 text-sky-300 font-bold',
              epic: 'border-amber-500/60 shadow-amber-500/15 bg-slate-950/90 text-amber-300 font-bold',
            };
            
            const emoji = (() => {
              switch (notif.icon) {
                case 'Wine': return '🧪';
                case 'FlaskConical': return '⚡';
                case 'Sword': return '🗡️';
                case 'Zap': return '⚡';
                case 'Shield': return '🛡️';
                case 'Shirt': return '👕';
                case 'Sparkles': return '💎';
                case 'Droplets': return '🟢';
                case 'Hammer': return '🔨';
                case 'Coins': return '🪙';
                case 'Crown': return '👑';
                case 'Scroll': return '📜';
                default: return '📦';
              }
            })();

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className={cn(
                  "flex items-center space-x-2.5 pointer-events-auto",
                  "border px-3 py-2 rounded-xl shadow-lg backdrop-blur-md",
                  borderColors[notif.rarity] || borderColors.common
                )}
                id={`toast-${notif.id}`}
              >
                {/* Rarity Ring Icon */}
                <div className={cn(
                  "relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm select-none",
                  notif.rarity === 'common' ? 'bg-slate-800' :
                  notif.rarity === 'rare' ? 'bg-sky-950 border border-sky-400/30' :
                  'bg-amber-950 border border-amber-400/30'
                )}>
                  <span className="relative z-10">{emoji}</span>
                  {notif.rarity === 'epic' && (
                    <motion.div 
                      className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                </div>

                {/* Text section */}
                <div className="flex-1 min-w-0 pr-0.5 select-none text-[11px]">
                  <div className="text-[8.5px] uppercase font-mono tracking-widest text-[#7c8ca3] leading-none mb-0.5">
                    RECOGIDO
                  </div>
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <span className="truncate">
                      {notif.itemName}
                    </span>
                    <span className="font-mono font-black text-slate-400 shrink-0">
                      x{notif.quantity}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 3. HERO CORNER IDENTITY HUD (Top Left) */}
      <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 w-56 sm:w-64 max-w-[calc(100vw-24px)] pointer-events-none transition-all duration-700 ${
          store.stats.level >= 50 ? "drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" : ""
      }`}>
        <div className={`bg-slate-950/80 backdrop-blur-xl border-y border-r border-l-4 rounded-r-2xl rounded-l-md p-2 sm:p-3 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-300 relative overflow-hidden ${
           store.stats.level >= 50 ? "border-amber-500/60 border-l-amber-400" : `border-slate-700/60 ${jobAura[store.jobClass]}`
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div 
            onClick={() => setMenuState({ isOpen: true, tab: 'status' })}
            className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 cursor-pointer group transition-all"
            title="Abrir Ficha de Personaje (Morfología, stats y cosméticos)"
          >
            {/* Avatar block */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 relative overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-400/50 transition-all ${
                store.stats.level >= 50 ? "bg-linear-to-br from-amber-600 to-amber-900 border-amber-300" : `bg-linear-to-b ${jobColors[store.jobClass]} border-white/10`
            }`}>
              {/* Stat/Skill Points Notification Dot */}
              {(store.statPoints > 0 || store.skillPoints > 0) && (
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-500 rounded-full border border-white z-20 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
              <span className="font-display text-xs sm:text-sm font-black text-white z-10 drop-shadow-md">L.{store.stats.level}</span>
              <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>

            {/* Profile info name */}
            <div className="min-w-0 flex-1 relative z-10">
              <h1 className="font-display text-xs sm:text-sm font-black text-white truncate flex items-center tracking-wider uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {store.stats.level === 99 ? '★ ' : ''}Rookie Hero
              </h1>
              <div className="flex items-center mt-0.5">
                <span className="font-mono text-[8.5px] sm:text-[10px] text-indigo-300 font-bold bg-indigo-950/60 px-1 py-0.5 rounded border border-indigo-500/30 truncate">
                  {store.jobClass} | Job L.{store.stats.jobLevel}
                </span>
              </div>
            </div>

            {/* Dedicated inventory trigger button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuState({ isOpen: true, tab: 'inventory' });
              }}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-slate-300 transition-all border border-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.4)] flex items-center justify-center relative shrink-0 z-10"
              title="Mochila / Inventario"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>

          {/* KILL STREAK BANNER */}
          <AnimatePresence>
            {store.killStreakCount >= 2 && (Date.now() - store.killStreakTimer < 6500) && (
              <motion.div
                key={`streak-${store.killStreakCount}`}
                initial={{ opacity: 0, height: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, y: -5, scale: 0.95 }}
                className="overflow-hidden mb-2 pointer-events-auto"
                transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              >
                <div className={cn(
                  "p-1.5 rounded-lg border flex items-center justify-between shadow-md backdrop-blur-md relative overflow-hidden bg-slate-900/90",
                  store.killStreakCount === 2 ? "border-amber-500/40 shadow-amber-500/20" :
                  store.killStreakCount === 3 ? "border-red-500/55 shadow-red-500/30" :
                  store.killStreakCount === 4 ? "border-fuchsia-500/70 shadow-fuchsia-500/45" :
                  "border-cyan-400/80 shadow-cyan-400/60"
                )}>
                  {/* Fire/glowing ambient overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-10 pointer-events-none bg-radial",
                    store.killStreakCount === 2 ? "from-amber-500 via-orange-500 to-transparent" :
                    store.killStreakCount === 3 ? "from-red-500 via-rose-500 to-transparent" :
                    store.killStreakCount === 4 ? "from-fuchsia-500 via-purple-500 to-transparent" :
                    "from-cyan-400 via-teal-500 to-transparent"
                  )} />

                  {/* Left Side: Badge with count */}
                  <div className="flex items-center space-x-1.5 relative z-10">
                    <div className={cn(
                      "w-5 h-5 sm:w-6 h-6 rounded-full flex items-center justify-center font-display font-black text-[10px] sm:text-xs text-white shadow-md border animate-bounce",
                      store.killStreakCount === 2 ? "bg-amber-500 border-amber-300" :
                      store.killStreakCount === 3 ? "bg-red-600 border-red-400" :
                      store.killStreakCount === 4 ? "bg-fuchsia-600 border-fuchsia-400" :
                      "bg-cyan-500 border-cyan-300"
                    )}>
                      {store.killStreakCount}
                    </div>

                    <div className="flex flex-col">
                      <span className={cn(
                        "font-display font-black text-[10px] sm:text-[11px] uppercase tracking-wide leading-none text-[#fff] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] bg-clip-text text-transparent bg-linear-to-r",
                        store.killStreakCount === 2 ? "from-amber-200 to-orange-400" :
                        store.killStreakCount === 3 ? "from-rose-200 to-red-500" :
                        store.killStreakCount === 4 ? "from-fuchsia-200 to-purple-500" :
                        "from-cyan-100 to-teal-400"
                      )}>
                        {store.killStreakCount === 2 ? "Double Kill!" :
                         store.killStreakCount === 3 ? "Triple Kill!!" :
                         store.killStreakCount === 4 ? "Mega Kill!!!" :
                         "Unstoppable!!!!"}
                      </span>
                      <span className="font-mono text-[7px] sm:text-[8px] text-slate-300 uppercase tracking-widest leading-none mt-0.5">
                        {store.killStreakCount === 2 ? "Racha de bajas" :
                         store.killStreakCount === 3 ? "¡Espectacular!" :
                         store.killStreakCount === 4 ? "¡Masacre total!" :
                         "¡Racha de héroe!"}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Simple tiny visual progress decay */}
                  <div className="w-12 sm:w-16 h-1 bg-slate-950/80 rounded-full overflow-hidden border border-white/5 relative shrink-0">
                    <motion.div
                      key={`timer-bar-${store.killStreakCount}-${store.killStreakTimer}`}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 6.5, ease: 'linear' }}
                      className={cn(
                        "h-full rounded-full shadow-[0_0_4px_rgba(255,255,255,0.45)]",
                        store.killStreakCount === 2 ? "bg-amber-400" :
                        store.killStreakCount === 3 ? "bg-red-500" :
                        store.killStreakCount === 4 ? "bg-fuchsia-500" :
                        "bg-cyan-400"
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HP Bar */}
          <div className="space-y-1 mb-2 relative z-10">
            <div className="flex justify-between text-[9px] font-mono font-black uppercase tracking-wider text-shadow-sm">
              <span className="text-red-400 drop-shadow-[0_0_3px_red]">HP</span>
              <span className="text-white drop-shadow-md z-10">{Math.floor(store.currentHp)} / {store.stats.maxHp}</span>
            </div>
            <div className="h-2 sm:h-3 bg-red-950/80 rounded border-t border-b border-red-900/80 overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-linear-to-r from-red-700 via-rose-500 to-red-400 transition-all duration-300 relative shadow-[inset_0_0_10px_rgba(255,255,255,0.3)]"
                style={{ width: `${Math.min(100, hpPercent)}%` }}
              >
                <div className="absolute top-0 inset-x-0 h-1/3 bg-white/30" />
                {hpPercent < 30 && <div className="absolute inset-0 bg-red-500/40 animate-pulse mix-blend-screen" />}
              </div>
            </div>
          </div>

          {/* SP Bar */}
          <div className="space-y-1 relative z-10">
            <div className="flex justify-between text-[9px] font-mono font-black uppercase tracking-wider text-shadow-sm">
              <span className="text-sky-400 drop-shadow-[0_0_3px_blue]">SP</span>
              <span className="text-white drop-shadow-md z-10">{Math.floor(store.currentSp)} / {store.stats.maxSp}</span>
            </div>
            <div className="h-1.5 sm:h-[10px] bg-blue-950/80 rounded border-y border-blue-800/60 overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-linear-to-r from-blue-700 via-sky-500 to-cyan-300 transition-all duration-300 relative overflow-hidden shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]"
                style={{ width: `${Math.min(100, spPercent)}%` }}
              >
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/25 rounded-t-full" />
                {/* Magical particles effect trick */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiLz48L3N2Zz4=')] opacity-50" />
              </div>
            </div>
          </div>

          {/* Status Effects */}
          {store.activeStatusEffects.length > 0 && (
            <div className="flex gap-1 mt-1 sm:mt-2">
              {store.activeStatusEffects.map((eff, i) => (
                <div key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/30"
                     style={{ backgroundColor: eff.type === 'haste' ? '#f59e0b' : eff.type === 'might' ? '#ef4444' : '#6366f1' }}
                     title={eff.type} />
              ))}
            </div>
          )}

          {/* Dynamic Combat State Badge */}
          <AnimatePresence>
            {store.battleMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-center space-x-1 bg-red-950/70 border border-red-500/30 text-red-400 font-mono font-bold text-[8px] sm:text-[9px] py-0.5 sm:py-1 rounded-lg shadow-sm animate-pulse">
                  <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 shrink-0" />
                  <span>MODO COMBATE ACTIVO</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. CONFIGURATION ACCESS BUTTON (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {/* Setup and Config drawer trigger buttons */}
        <button 
          onClick={store.toggleConfigPanel}
          className="bg-slate-950/80 backdrop-blur-xl border-y border-l border-r-4 border-slate-700/80 p-3 rounded-l-xl rounded-r-md shadow-[0_5px_15px_-3px_rgba(0,0,0,0.5)] pointer-events-auto hover:border-slate-500 text-slate-300 hover:text-white transition-all hover:scale-105 cursor-pointer relative overflow-hidden group"
          title="Configuración de Inputs"
          id="config-sidebar-btn"
        >
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Settings className="w-5 h-5 shrink-0 relative z-10" />
        </button>
      </div>


      {/* 5. CONFIG SYSTEM PANEL DRAWERS OVERLAY */}
      <AnimatePresence>
        {store.showConfigPanel && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-20 right-4 z-20 w-80 max-h-[82vh] bg-[#0f172ae8] backdrop-blur-lg border border-slate-800 p-5 rounded-2xl shadow-2xl overflow-y-auto"
            id="configurator-drawer"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-display font-medium text-slate-200 tracking-tight flex items-center">
                <Layers className="w-4 h-4 mr-2 stroke-cyan-400" /> Configuración de Entrada
              </h2>
              <button 
                onClick={store.toggleConfigPanel}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-800 transition"
              >
                Cerrar
              </button>
            </div>
            
            <div className="space-y-4">
                <div className="flex flex-col p-3 bg-slate-950/50 rounded-lg border border-slate-800 gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium tracking-tight">Auto-Pickup</span>
                        <button
                            onClick={() => {
                                store.toggleAutoPickup();
                                setShowSaved(true);
                                setTimeout(() => setShowSaved(false), 2000);
                            }}
                            className={`w-10 h-5 rounded-full relative transition-all ${store.autoPickupEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${store.autoPickupEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">Collects items within a 1.35m radius</span>
                </div>
                <div className="flex flex-col p-3 bg-slate-950/50 rounded-lg border border-slate-800 gap-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span className="text-xs text-slate-200 font-bold tracking-tight flex items-center">
                            <Eye className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Cámara y Enfoque
                        </span>
                        <button
                            onClick={() => {
                                store.setCameraZoom(1.0);
                                store.setCameraAngleY(0);
                                store.setCameraOffsetZ(2.2);
                                setShowSaved(true);
                                setTimeout(() => setShowSaved(false), 2000);
                            }}
                            className="text-[10px] text-slate-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                            <RefreshCw className="w-2.5 h-2.5" /> Resetear
                        </button>
                    </div>

                    {/* Offset / Desplazamiento slider */}
                    <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 font-medium">Elevación de Personaje</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/45">{(store.cameraOffsetZ ?? 2.2).toFixed(1)}m</span>
                        </div>
                        <input
                            type="range"
                            min="0.0"
                            max="4.5"
                            step="0.1"
                            value={store.cameraOffsetZ ?? 2.2}
                            onChange={(e) => store.setCameraOffsetZ(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[9.5px] text-slate-500 leading-normal block">
                            Mueve tu personaje hacia arriba. ¡Liberación masiva de espacio al <b>Sur</b> para poder hacer tap cómodo en móvil!
                        </span>
                    </div>

                    {/* Camera Zoom slider */}
                    <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 font-medium">Zoom de Cámara</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/45">{(store.cameraZoom ?? 1.0).toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.6"
                            max="1.5"
                            step="0.05"
                            value={store.cameraZoom ?? 1.0}
                            onChange={(e) => store.setCameraZoom(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[9.5px] text-slate-500 leading-normal block">
                            Menor zoom para ampliar la vista del campo exterior, mayor zoom para un enfoque cinematográfico de tu héroe.
                        </span>
                    </div>

                    {/* Camera Rotation slider */}
                    <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 font-medium">Rotación 3D (Y-Axis)</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/45">{(store.cameraAngleY ?? 0)}°</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={store.cameraAngleY ?? 0}
                            onChange={(e) => store.setCameraAngleY(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[9.5px] text-slate-500 leading-normal block">
                            Gira la cámara 360° completos alrededor del personaje para explorar desde cualquier orientación visual.
                        </span>
                    </div>
                </div>

                {/* Atmósfera y Ecosistema Section */}
                <div className="flex flex-col p-3 bg-slate-950/50 rounded-lg border border-slate-800 gap-2 mt-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span className="text-xs text-slate-200 font-bold tracking-tight flex items-center">
                            <Wind className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" /> Atmósfera y Vida
                        </span>
                        <button
                            onClick={triggerBreeze}
                            disabled={isBreezing}
                            className={`text-[9px] font-bold px-2 py-1 rounded border flex items-center gap-1 cursor-pointer transition-all ${
                              isBreezing 
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 animate-pulse' 
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-white'
                            }`}
                        >
                            <Wind className="w-2.5 h-2.5" />
                            {isBreezing ? 'Soplando...' : 'Soplar Brisa'}
                        </button>
                    </div>

                    {/* Wind sliders */}
                    <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 font-medium">Sway del Viento (Fuerza)</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/45">{ambientConfig.windForce.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.0"
                            max="3.0"
                            step="0.1"
                            value={ambientConfig.windForce}
                            onChange={(e) => setAmbientConfig(prev => ({ ...prev, windForce: parseFloat(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 font-medium">Velocidad del Ciclo</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/45">{ambientConfig.windSpeed.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={ambientConfig.windSpeed}
                            onChange={(e) => setAmbientConfig(prev => ({ ...prev, windSpeed: parseFloat(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    {/* Category toggles grid */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {/* Butterflies */}
                        <div className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                <Bug className="w-2.5 h-2.5 text-pink-400 shrink-0" /> Mariposas
                            </span>
                            <button
                                onClick={() => setAmbientConfig(prev => ({ ...prev, butterflies: !prev.butterflies }))}
                                className={`w-6 h-3.5 rounded-full relative transition-all ${ambientConfig.butterflies ? 'bg-pink-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${ambientConfig.butterflies ? 'left-3' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Birds */}
                        <div className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                <Bird className="w-2.5 h-2.5 text-sky-400 shrink-0" /> Soaring Aves
                            </span>
                            <button
                                onClick={() => setAmbientConfig(prev => ({ ...prev, birds: !prev.birds }))}
                                className={`w-6 h-3.5 rounded-full relative transition-all ${ambientConfig.birds ? 'bg-sky-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${ambientConfig.birds ? 'left-3' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Falling Leaves */}
                        <div className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                <Leaf className="w-2.5 h-2.5 text-orange-400 shrink-0" /> Hojas Caídas
                            </span>
                            <button
                                onClick={() => setAmbientConfig(prev => ({ ...prev, leaves: !prev.leaves }))}
                                className={`w-6 h-3.5 rounded-full relative transition-all ${ambientConfig.leaves ? 'bg-orange-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${ambientConfig.leaves ? 'left-3' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Fireflies */}
                        <div className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-yellow-400 shrink-0" /> Luciérnagas
                            </span>
                            <button
                                onClick={() => setAmbientConfig(prev => ({ ...prev, fireflies: !prev.fireflies }))}
                                className={`w-6 h-3.5 rounded-full relative transition-all ${ambientConfig.fireflies ? 'bg-yellow-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${ambientConfig.fireflies ? 'left-3' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONFIGURACIÓN DE DROPS / LOOT (Probabilidades) */}
                <div className="flex flex-col p-3 bg-slate-950/50 rounded-lg border border-slate-800 gap-2 mt-2" id="loot-drop-config">
                    <span className="text-xs text-slate-200 font-bold tracking-tight flex items-center pb-1 border-b border-slate-850/80">
                        <Coins className="w-3.5 h-3.5 mr-1.5 text-yellow-450" /> Configurar Probabilidades de Drops
                    </span>
                    
                    <div className="space-y-3 mt-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {Object.entries(store.lootTables).map(([mob, drops]) => {
                            const mobName = mob === 'poring' ? 'Poring' :
                                            mob === 'poporing' ? 'Poporing' :
                                            mob === 'pecopeco' ? 'PecoPeco' : 'MVP Baphomet';
                            return (
                                <div key={mob} className="space-y-1.5 border-b border-slate-900/80 pb-2 last:border-0 last:pb-0">
                                    <span className="text-[10.5px] font-bold text-slate-400 block tracking-wider uppercase">{mobName}</span>
                                    {drops.map((drop) => {
                                        const itemInfo = ITEM_DATABASE[drop.itemId];
                                        const itemName = itemInfo ? itemInfo.name : drop.itemId;
                                        return (
                                            <div key={drop.itemId} className="space-y-1 pl-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-300 truncate max-w-[120px]">{itemName}</span>
                                                    <span className="text-[9px] font-mono font-bold text-yellow-405 bg-yellow-950/40 px-1 py-0.2 rounded border border-yellow-800/30">{(drop.chance * 100).toFixed(0)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.0"
                                                    max="1.0"
                                                    step="0.05"
                                                    value={drop.chance}
                                                    onChange={(e) => {
                                                        store.updateDropRate(mob, drop.itemId, parseFloat(e.target.value));
                                                        setShowSaved(true);
                                                        const timeoutId = setTimeout(() => setShowSaved(false), 2000);
                                                        return () => clearTimeout(timeoutId);
                                                    }}
                                                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                    <span className="text-[9px] text-slate-400 leading-relaxed block">
                        Modifica los ratios en vivo. Cada monstruo realiza tiradas de dados independientes para cada ítem de su tabla de drops.
                    </span>
                </div>

                {showSaved && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-emerald-400 font-medium text-center mt-1 font-bold"
                    >
                        ✓ Configuración guardada con éxito
                    </motion.div>
                )}
                {/* Other config options... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. ADVANCED MULTITOUCH GAMEPAD OVERLAYS (Bottom Margin Panels) */}
      {/* Right-Hand Attack Bubble Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 flex flex-col items-end space-y-3 pointer-events-none">
        
        {/* Battle Action Buttons */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          {/* Manual Attack Button */}
          <button 
            onClick={() => {
              if (store.engineInstance) {
                store.engineInstance.triggerManualAttack();
              }
            }}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full border-[3px] border-amber-400 bg-linear-to-b from-amber-500 via-orange-600 to-amber-950 text-white shadow-[0_8px_20px_rgba(245,158,11,0.5),inset_0_3px_10px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 active:scale-90 cursor-pointer relative overflow-hidden flex flex-col items-center justify-center group"
            title="Ataque Físico / Adquirir objetivo"
            id="manual-attack-btn"
          >
            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
            <Swords className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-amber-50 group-hover:rotate-12 transition-transform duration-200" />
            <span className="text-[7.5px] sm:text-[9.5px] font-black tracking-widest mt-0.5 relative z-10 drop-shadow-md text-amber-100">ATACAR</span>
          </button>

          {/* Toggle AutoBattle */}
          <button 
            onClick={store.toggleAutoBattle}
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-full border-[3px] shadow-[0_8px_20px_rgba(0,0,0,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden flex flex-col items-center justify-center",
              store.autoBattle 
              ? "bg-linear-to-br from-red-600 via-rose-600 to-red-950 border-red-400 text-white shadow-[0_0_25px_rgba(225,29,72,0.6),inset_0_0_15px_rgba(0,0,0,0.5)]" 
              : "bg-linear-to-b from-slate-700 to-slate-900 border-slate-500 text-slate-300 hover:text-white"
            )}
            title="Toggle Auto-Battle"
            id="autobattle-toggle-btn"
          >
            {store.autoBattle && <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
            <Zap className={cn("w-5 h-5 sm:w-7 sm:h-7 shrink-0 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]", store.autoBattle ? "animate-pulse text-yellow-300" : "text-slate-300")} />
            <span className="text-[7.5px] sm:text-[9.5px] font-black tracking-widest mt-0.5 relative z-10 drop-shadow-md">AUTO</span>
          </button>
        </div>

        {/* Potion inventory count sticker */}
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center space-x-1 pointer-events-auto">
              <span className="font-display text-[9px] sm:text-[11px] bg-slate-950/90 text-white border border-slate-700 font-black px-1.5 py-1 rounded-full shrink-0 shadow-lg tracking-wider">
                <span className="text-red-400 mr-0.5 sm:mr-1">x{store.potCount}</span> POT
              </span>
              <button 
                onClick={() => store.addToInputBuffer({ type: 'potion' })}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-b from-red-400 via-red-600 to-red-900 shadow-[0_8px_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all text-white border-2 border-red-300 flex items-center justify-center cursor-pointer relative overflow-hidden"
                id="drink-pot-btn"
              >
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full" />
                <Pocket className="w-6 h-6 shrink-0 relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
              </button>
            </div>
        </div>

        {/* Skill bubbled list */}
        <div className="flex items-center space-x-2 sm:space-x-4 pointer-events-auto mt-2">
          {store.equippedSkills.map((skillId, index) => {
            const skill = store.skills.find(s => s.id === skillId);
            if (!skill || skill.level === 0) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className={cn(
                    "relative flex flex-col items-center rounded-full transition-all border-2 border-dashed border-slate-700 bg-slate-900/40 p-0.5",
                    draggedSlotIndex !== null && "border-indigo-500/45 bg-indigo-950/20 scale-105"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndexStr = e.dataTransfer.getData("text/plain");
                    if (fromIndexStr) {
                      const fromIdx = parseInt(fromIndexStr, 10);
                      if (!isNaN(fromIdx) && fromIdx !== index) {
                        const newEquipped = [...store.equippedSkills];
                        const temp = newEquipped[fromIdx];
                        newEquipped[fromIdx] = null;
                        newEquipped[index] = temp;
                        useGameStore.setState({ equippedSkills: newEquipped });
                        store.saveGame();
                      }
                    }
                  }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-slate-600 font-extrabold text-[10px] opacity-60">
                    SLOT {index + 1}
                  </div>
                </div>
              );
            }

            const lastCast = skill.lastCastTime || 0;
            const elapsed = currentTime - lastCast;
            const cooldown = skill.cooldown;
            const isOnCooldown = elapsed < cooldown;
            const degreesRemaining = isOnCooldown ? ((cooldown - elapsed) / cooldown) * 360 : 0;

            const hotbarKeys = ['Q', 'W', 'E', 'R'];
            const displayKey = hotbarKeys[index] || skill.key;

            return (
              <div 
                key={skill.id} 
                className={cn(
                  "relative flex flex-col items-center transition-all",
                  draggedSlotIndex === index ? "opacity-35 scale-95" : "hover:scale-105"
                )}
                draggable={true}
                onDragStart={(e) => {
                  setDraggedSlotIndex(index);
                  e.dataTransfer.setData("text/plain", index.toString());
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggedSlotIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndexStr = e.dataTransfer.getData("text/plain");
                  if (fromIndexStr) {
                    const fromIdx = parseInt(fromIndexStr, 10);
                    if (!isNaN(fromIdx) && fromIdx !== index) {
                      const newEquipped = [...store.equippedSkills];
                      const temp = newEquipped[fromIdx];
                      newEquipped[fromIdx] = newEquipped[index];
                      newEquipped[index] = temp;
                      useGameStore.setState({ equippedSkills: newEquipped });
                      store.saveGame();
                    }
                  }
                }}
              >
                {/* Floating SP Cost tag */}
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 font-display text-[8px] sm:text-[9px] bg-sky-950 border border-sky-400 text-sky-300 px-1 py-0 rounded shadow-lg z-20 font-black pointer-events-none">
                  {skill.spCost} SP
                </div>

                {/* Instant Tap/Click Reorder Action bubble */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setActiveReorderMenu(index);
                  }}
                  className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-indigo-600 border border-indigo-400 rounded-full flex items-center justify-center text-[9.5px] text-white font-black shadow-[0_2px_8px_rgba(99,102,241,0.6)] z-20 hover:bg-indigo-500 active:scale-90 transition-transform cursor-pointer"
                  title="Reordenar / Intercambiar acceso rápido"
                >
                  ⇅
                </button>
                
                <button
                  onClick={(e) => {
                    if (isLongPressActive) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    store.castSkill(skill.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setActiveReorderMenu(index);
                  }}
                  onTouchStart={() => {
                    setIsLongPressActive(false);
                    if (reorderLongPressTimeoutRef.current) clearTimeout(reorderLongPressTimeoutRef.current);
                    reorderLongPressTimeoutRef.current = setTimeout(() => {
                      setIsLongPressActive(true);
                      setActiveReorderMenu(index);
                      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50);
                      }
                    }, 400);
                  }}
                  onTouchEnd={(e) => {
                    if (reorderLongPressTimeoutRef.current) clearTimeout(reorderLongPressTimeoutRef.current);
                    if (isLongPressActive) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onMouseDown={() => {
                    setIsLongPressActive(false);
                    if (reorderLongPressTimeoutRef.current) clearTimeout(reorderLongPressTimeoutRef.current);
                    reorderLongPressTimeoutRef.current = setTimeout(() => {
                      setIsLongPressActive(true);
                      setActiveReorderMenu(index);
                    }, 400);
                  }}
                  onMouseUp={(e) => {
                    if (reorderLongPressTimeoutRef.current) clearTimeout(reorderLongPressTimeoutRef.current);
                    if (isLongPressActive) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  disabled={isOnCooldown || !!(store.activeCast && skill.castTime && skill.castTime > 0)}
                  className={cn(
                    "relative overflow-hidden w-14 h-14 sm:w-16 sm:h-16 rounded-full select-none flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all active:scale-90",
                    skill.id === 'bash' ? "border-4 border-slate-300 bg-linear-to-b from-orange-400 to-orange-700 shadow-[inset_0_3px_15px_rgba(255,255,255,0.6),0_8px_16px_rgba(0,0,0,0.6)]" :
                    skill.id === 'bowling_bash' ? "border-[3px] border-red-500 bg-linear-to-b from-red-800 to-red-950 shadow-[inset_0_0_25px_rgba(239,68,68,1),0_0_20px_rgba(220,38,38,0.7)]" :
                    `border-2 border-white/40 shadow-[0_8px_16px_rgba(0,0,0,0.6)]`
                  )}
                  style={!['bash', 'bowling_bash'].includes(skill.id) ? { backgroundImage: `linear-gradient(to bottom, ${skill.color}dd, ${skill.color})` } : {}}
                  id={`skill-bubble-${skill.id}`}
                >
                  {/* Energy core for heavy skills */}
                  {skill.id === 'bowling_bash' && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent animate-pulse" />}
                  {skill.id === 'bash' && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/50 to-transparent" />}

                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />

                  {/* Cooldown shutter sweep overlay */}
                  {isOnCooldown && (
                    <div 
                      className="absolute inset-0 bg-slate-950/80 z-[1]"
                      style={{
                        background: `conic-gradient(rgba(15, 23, 42, 0.9) ${degreesRemaining}deg, transparent ${degreesRemaining}deg)`
                      }}
                    />
                  )}

                  {/* Cooldown countdown counter label */}
                  {isOnCooldown && (
                    <span className="absolute inset-0 flex items-center justify-center font-display text-[16px] text-yellow-400 font-black z-[2] select-none text-shadow-md">
                      {((cooldown - elapsed) / 1000).toFixed(1)}
                    </span>
                  )}

                  <span className={`text-[8.5px] sm:text-[10px] block leading-[1] text-center px-1 tracking-tight mt-1 relative z-[2] font-black drop-shadow-md ${isOnCooldown ? 'opacity-0' : ''}`}>{skill.name.replace(' ', '\n')}</span>
                  <span className={`text-[8px] text-white/80 block uppercase font-mono relative z-[2] font-semibold drop-shadow-md mt-0.5 ${isOnCooldown ? 'opacity-0' : ''}`}>{displayKey}</span>
                </button>

                {/* Highly aesthetic Popover Option Menu */}
                {activeReorderMenu === index && (
                  <>
                    {/* Dark click interceptor backdrop overlay */}
                    <div 
                      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveReorderMenu(null);
                      }}
                    />
                    
                    {/* Rich context popover container */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-[#09101c]/95 border-2 border-indigo-500/80 backdrop-blur-md rounded-2xl p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(99,102,241,0.3)] z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-1 pb-1.5 border-b border-slate-800/80 mb-1 text-center">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">REORDENAR ACCESO</span>
                        <span className="text-[11.5px] font-black text-amber-400 mt-1 block truncate leading-tight">
                          {skill.name}
                        </span>
                        <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                          Slot Actual: {['Q', 'W', 'E', 'R'][index]}
                        </span>
                      </div>

                      {[0, 1, 2, 3].map((slotIdx) => {
                        if (slotIdx === index) return null;
                        const targetSkillId = store.equippedSkills[slotIdx];
                        const targetSkill = targetSkillId ? store.skills.find(s => s.id === targetSkillId) : null;
                        const keyLetter = ['Q', 'W', 'E', 'R'][slotIdx];

                        return (
                          <button
                            key={slotIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newEquipped = [...store.equippedSkills];
                              newEquipped[index] = targetSkillId;
                              newEquipped[slotIdx] = skillId;
                              useGameStore.setState({ equippedSkills: newEquipped });
                              store.saveGame();
                              setActiveReorderMenu(null);
                            }}
                            className="w-full text-left bg-slate-950/70 hover:bg-slate-900 border border-slate-800/85 hover:border-slate-700/85 text-[11px] text-slate-100 font-bold p-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-indigo-950 text-indigo-400 border border-indigo-900/60 rounded flex items-center justify-center font-mono font-black text-[9.5px]">
                                {keyLetter}
                              </span>
                              <span>Mover aquí</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-extrabold italic max-w-[75px] truncate">
                              {targetSkill ? targetSkill.name : 'Vacío'}
                            </span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newEquipped = [...store.equippedSkills];
                          newEquipped[index] = null;
                          useGameStore.setState({ equippedSkills: newEquipped });
                          store.saveGame();
                          setActiveReorderMenu(null);
                        }}
                        className="w-full text-left bg-red-950/40 hover:bg-red-900/40 border border-red-950/50 hover:border-red-500/30 text-[10.5px] text-red-300 font-black p-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all mt-0.5"
                      >
                        <span>❌ Desequipar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6.5. HIGH FIDELITY SPELL CAST CHANTING BAR */}
      <AnimatePresence>
        {store.activeCast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.82, y: -10, x: '-50%' }}
            className="absolute bottom-36 left-1/2 z-20 w-72 bg-slate-950/95 border border-emerald-500/40 backdrop-blur-md rounded-xl p-3 shadow-[0_0_20px_rgba(16,185,129,0.22)] pointer-events-none select-none"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-ping shrink-0" />
                CHANTEANDO: {store.activeCast.skillName}
              </span>
              <span className="text-[9px] font-mono font-extrabold text-emerald-300">
                {Math.max(0, (store.activeCast.durationMs - store.activeCast.elapsedMs) / 1000).toFixed(1)}s
              </span>
            </div>
            
            {/* Visual Progress Track */}
            <div className="w-full h-2.5 bg-slate-900 rounded-lg overflow-hidden border border-emerald-500/10 p-0.5">
              <div 
                className="h-full rounded-md shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-[33ms] ease-out"
                style={{ 
                  width: `${Math.min(100, (store.activeCast.elapsedMs / store.activeCast.durationMs) * 100)}%`,
                  backgroundColor: store.activeCast.color || '#10b981'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. DYNAMIC LIVE INPUT BUFFER MONITOR QUEUE (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-none hidden">
        <div className="bg-[#0f172ad0] backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-widest uppercase flex items-center">
              <FastForward className="w-3 h-3 mr-1.5 stroke-cyan-400 fill-cyan-400/10 shrink-0" /> Buffer de Input
            </span>
            <span className="text-[8px] font-mono font-bold text-slate-500">Expiración: ~1200ms</span>
          </div>

          <div className="flex items-center space-x-1.5 min-h-[32px] bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 overflow-x-auto">
            {store.bufferingQueue.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-500 italic mx-auto">Esperando comandos de toque...</span>
            ) : (
              store.bufferingQueue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold shrink-0 flex items-center ${
                    item.type === 'skill' 
                      ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                      : item.type === 'potion' 
                      ? 'bg-red-950/60 border-red-800 text-red-300'
                      : item.type === 'target' 
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-sky-950/60 border-sky-800 text-sky-300'
                  }`}
                >
                  <span className="uppercase">{item.type}</span>
                  {item.skillId && <span className="ml-1 opacity-70">({item.skillId})</span>}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 8. COMBAT LOG STREAM LOGGER (Bottom Left) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 w-full max-w-[200px] sm:max-w-[240px] pointer-events-none flex flex-col items-start gap-2 sm:gap-3">
        {/* Minimap */}
        <Minimap player={minimapData.player} monsters={minimapData.monsters} />
        
        <AnimatePresence>
          {store.showCombatLog && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 80, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0b0f1960] backdrop-blur-md border border-slate-900/50 p-2 sm:p-2.5 rounded-xl shadow-lg pointer-events-auto h-20 sm:h-24 overflow-hidden relative border-solid text-[#98acc5]"
            >
             <div className="absolute inset-x-0 bottom-0 top-6 bg-linear-to-b from-transparent via-[#0b0f1902] to-[#0b0f19] pointer-events-none z-1" />
             <span className="text-[8px] sm:text-[9px] font-mono font-bold text-slate-400 block tracking-widest uppercase mb-1 flex items-center">
               <MessageSquareText className="w-3 h-3 mr-1 stroke-slate-500 shrink-0" /> Bitácora
             </span>

             <div className="space-y-1 overflow-y-auto h-[48px] sm:h-[60px] pr-1 select-text">
               {store.combatLogs.map((log) => (
                 <div key={log.id} className={
                   `text-[10px] font-mono leading-normal leading-normal px-1 rounded ${
                       (log.type === 'loot' || log.type === 'mvp') ? 'bg-white/5' : ''
                   }`
                 }>
                   <span className="text-slate-600 mr-1 select-none shrink-0 text-[8px] font-bold">[{log.timestamp}]</span>
                   <span className={
                     log.type === 'system' ? 'text-slate-400' :
                     log.type === 'mvp' ? 'text-yellow-400 font-bold' :
                     log.type === 'loot' ? 'text-cyan-400 font-bold' :
                     log.type === 'heal' ? 'text-emerald-400' :
                     log.type === 'skill' ? 'text-purple-400' :
                     log.type === 'player_hit' ? 'text-rose-400' : 'text-red-400'
                   }>
                     {log.text}
                   </span>
                 </div>
               ))}
             </div>

             {/* Dynamic Chat Input Field */}
             <div className="mt-1.5 flex items-center gap-1.5 border-t border-slate-800/40 pt-1.5">
               <input
                 ref={chatInputRef}
                 type="text"
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onFocus={() => store.addCombatLog('Precaución: Teclado activo. Presiona Enter para enviar.', 'system')}
                 placeholder="Escribe un comando o chat..."
                 className="flex-1 bg-slate-950/40 border-none outline-none text-[9px] font-mono text-slate-300 placeholder:text-slate-600 px-1 py-0.5 rounded focus:bg-slate-950/80 transition-colors"
               />
               <button 
                 onClick={handleChatSubmit}
                 className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[8px] font-bold text-slate-300 uppercase tracking-tighter transition-all active:scale-95"
               >
                 OK
               </button>
             </div>
           </motion.div>
          )}
        </AnimatePresence>
        <button 
            onClick={() => useGameStore.setState({ showCombatLog: !useGameStore.getState().showCombatLog })}
            className="pointer-events-auto bg-slate-800/80 p-2 rounded-full text-white hover:bg-slate-700 transition"
        >
            <MessageSquareText className="w-4 h-4" />
        </button>
      </div>

      {/* SYSTEM TOAST (Subtle HUD popup on bottom) */}
      <AnimatePresence>
        {store.systemToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-200 uppercase tracking-widest">{store.systemToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. EXPERIENCE STATS BOTTOM GAUGE RAIL */}
      <div className="absolute bottom-0 inset-x-0 h-1 z-10 flex flex-col">
        {/* Base EXP gauge bar */}
        <div className="h-0.5 bg-slate-950 flex">
          <div 
            className="h-full bg-cyan-400 shadow-xs transition-all duration-300"
            style={{ width: `${baseExpPercent}%` }}
            title={`Base EXP: ${store.playerBaseExp} / ${store.playerBaseMaxExp} (${Math.round(baseExpPercent)}%)`}
          />
        </div>
        {/* Job EXP gauge bar */}
        <div className="h-0.5 bg-slate-900 flex">
          <div 
            className="h-full bg-emerald-400 shadow-xs transition-all duration-300"
            style={{ width: `${jobExpPercent}%` }}
            title={`Job EXP: ${store.playerJobExp} / ${store.playerJobMaxExp} (${Math.round(jobExpPercent)}%)`}
          />
        </div>
      </div>

      {/* 11. RETRO RAGNAROK NPC DIALOGUE OVERLAY */}
      <AnimatePresence>
        {store.npcDialogue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 md:left-auto md:right-12 md:-translate-x-0 z-20 w-[95%] max-w-[480px] pointer-events-auto"
            id="npc-dialogue-modal"
          >
            {/* Main Rag Blue-Silver themed Window */}
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] border-y border-x-4 border-indigo-500/50 overflow-hidden text-slate-200 font-sans p-5 relative ring-1 ring-white/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* NPC Name Title Header Banner */}
              <div className="flex items-center space-x-2 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-2.5 rounded-t-xl -mt-5 -mx-5 mb-4 border-b border-indigo-500/30 relative overflow-hidden shadow-md">
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5" />
                <Sparkles className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse relative z-10" />
                <span className="font-display font-black text-[14px] tracking-widest uppercase drop-shadow-md relative z-10 text-amber-100">{store.npcDialogue.npcName}</span>
                <span className="text-[10px] font-mono text-indigo-300 ml-auto uppercase font-bold relative z-10">Interacción</span>
              </div>

              {/* Dialogue Main Text paragraph */}
              <div className="bg-slate-950/50 border border-indigo-900/50 shadow-inner rounded-xl p-4 text-[13px] leading-relaxed font-medium mb-5 text-indigo-100 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl opacity-30" />
                {store.npcDialogue.text}
              </div>

              {/* Options vertical pile */}
              <div className="space-y-2">
                {store.npcDialogue.options.map((opt, i) => (
                  <button
                    key={`${i}_${opt.actionParam}`}
                    onClick={() => {
                      if (engineRef.current) {
                        engineRef.current.handleNpcAction(store.npcDialogue!.npcId, opt.actionParam);
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold bg-linear-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-indigo-800 active:scale-[0.98] border border-indigo-500/30 hover:border-indigo-400 text-indigo-100 transition-all select-none cursor-pointer flex items-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/50 text-indigo-300 font-display text-[10px] flex items-center justify-center mr-3 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] group-hover:bg-indigo-600 group-hover:text-white transition-colors">{i + 1}</span>
                    <span className="truncate relative z-10 drop-shadow-md">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. RESURRECTION MODAL POPUP IF FALLEN */}
      <AnimatePresence>
        {store.currentHp <= 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-linear-to-b from-slate-900 to-slate-950 border-y border-x-4 border-red-600/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_20px_60px_-15px_rgba(220,38,38,0.4)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1/2 bg-red-500/5 rounded-t-3xl border-b border-red-500/10" />

              {/* Decorative aura */}
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-red-600/20 blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-red-600/20 blur-2xl" />

              <div className="relative z-10">
                <AlertTriangle className="w-16 h-16 stroke-red-500 mx-auto mb-6 animate-bounce drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                
                <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase text-shadow-lg mb-2">¡Has Caído!</h2>
                <div className="h-px bg-linear-to-r from-transparent via-red-500/50 to-transparent w-3/4 mx-auto mb-4" />
                
                <p className="text-[13px] text-slate-300 font-sans leading-relaxed mb-6 font-medium">
                  El boss MVP Baphomet o las hordas del pantano han superado tu temple. Tus items están asegurados contra pérdidas de loot.
                </p>

                {/* Action revives instantly */}
                <button
                  onClick={() => {
                    if (engineRef.current) {
                      engineRef.current.revivePlayer();
                    }
                  }}
                  className="w-full py-4 px-4 rounded-xl font-black bg-linear-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 text-white shadow-[0_10px_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all text-[15px] select-none cursor-pointer border-2 border-red-400/50 relative overflow-hidden uppercase tracking-wider"
                  id="resurrect-trigger"
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-xl" />
                  <span className="relative z-10 drop-shadow-md">Volver a Prontera</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
