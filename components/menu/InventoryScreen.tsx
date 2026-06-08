'use client';

import React, { useState, useRef } from 'react';
import { InventoryItem, EquipmentSlot } from '../../lib/game/types';
import { useGameStore } from '../../lib/game/state';
import { itemDetailsDb } from './constants';

interface InventoryScreenProps {
  triggerHaptic: (pattern: number | number[]) => void;
  setActiveTab: (tab: 'status' | 'inventory' | 'skills') => void;
}

export const InventoryScreen = ({ triggerHaptic, setActiveTab }: InventoryScreenProps) => {
  const store = useGameStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [backpackTab, setBackpackTab] = useState<'all' | 'equipment' | 'consumable' | 'material'>('all');
  const [pendingSwapFromIndex, setPendingSwapFromIndex] = useState<number | null>(null);

  // Pointer/Touch handling for drag & drop simulation (simplified for mobile)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);

  const handlePointerDown = (item: any, e: React.PointerEvent) => {
    if (item.isEquipped) return;
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setPendingSwapFromIndex(item.slotIndex);
      triggerHaptic([20, 10]);
    }, 600);
  };

  const handlePointerUp = (item: any, e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragging.current) {
      isDragging.current = false;
    }
  };

  const handlePointerEnter = (item: any, e: React.PointerEvent) => {
    // If we're dragging and enter another slot, we could show target highlight
  };

  const handlePointerLeave = (item: any, e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleEquip = (item: InventoryItem) => {
    if (!item.slot) return;
    store.equipItem(item.id, item.slot);
    store.addCombatLog(`Equipado: [${item.name}] en ranura [${item.slot}].`, 'system');
    setSelectedItem(null);
    triggerHaptic(15);
  };

  const handleUnequip = (slot: EquipmentSlot, name: string) => {
    store.unequipItem(slot);
    store.addCombatLog(`Desequipado: [${name}]. Se guardó en la mochila.`, 'system');
    setSelectedItem(null);
    triggerHaptic(15);
  };

  const handleUseConsumable = (item: InventoryItem) => {
    if (item.slotIndex !== undefined) {
      store.useConsumable(item.slotIndex);
      const updatedItem = store.inventory.find(i => i.slotIndex === item.slotIndex);
      if (updatedItem && updatedItem.quantity > 0) {
        setSelectedItem({ ...updatedItem, isEquipped: false });
      } else {
        setSelectedItem(null);
      }
    } else {
      if (item.id === 'red_potion') store.drinkPotion();
      setSelectedItem(null);
    }
    triggerHaptic(10);
  };

  const handleDiscard = (item: InventoryItem) => {
    if (item.slotIndex !== undefined) {
      const res = store.removeItemBySlotIndex(item.slotIndex, 1);
      if (res.success) {
        store.addCombatLog(`Tiraste 1x [${item.name}].`, 'system');
        if (item.id === 'red_potion') {
          const totalNewPots = store.inventory
            .filter(i => i.id === 'red_potion')
            .reduce((acc, curr) => acc + curr.quantity, 0);
          store.setPotCount(totalNewPots);
        }
        const updatedItem = store.inventory.find(i => i.slotIndex === item.slotIndex);
        if (updatedItem && updatedItem.quantity > 0) {
          setSelectedItem({ ...updatedItem, isEquipped: false });
        } else {
          setSelectedItem(null);
        }
      }
    } else {
      const updated = store.inventory.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      ).filter(i => i.quantity > 0);
      if (item.id === 'red_potion') store.setPotCount(Math.max(0, store.potCount - 1));
      useGameStore.setState({ inventory: updated });
      store.addCombatLog(`Descartado: 1x [${item.name}].`, 'system');
      const updatedItem = updated.find(i => i.id === item.id);
      if (updatedItem) setSelectedItem({ ...updatedItem, isEquipped: false });
      else setSelectedItem(null);
    }
    triggerHaptic(20);
  };

  const getRarityStyles = (itemId: string) => {
    const details = itemDetailsDb[itemId] || { rarity: 'common' };
    switch (details.rarity) {
      case 'epic':
        return {
          border: 'border-amber-500 bg-amber-950/40 text-amber-100 ring-1 ring-amber-500/30',
          badge: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
          color: 'text-amber-400'
        };
      case 'rare':
        return {
          border: 'border-indigo-500 bg-indigo-950/40 text-indigo-100 ring-1 ring-indigo-500/30',
          badge: 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50',
          color: 'text-indigo-400'
        };
      default:
        return {
          border: 'border-slate-800 bg-slate-900/40 text-slate-400',
          badge: 'bg-slate-800/50 text-slate-500 border-slate-700',
          color: 'text-slate-500'
        };
    }
  };

  const getFirstItemAvailable = () => {
    const activeEquipSlots: EquipmentSlot[] = ['rightHand', 'body', 'head', 'leftHand', 'accessory1', 'accessory2', 'cape', 'mount', 'pet', 'costume'];
    for (const slot of activeEquipSlots) {
      const eqItem = store.equippedItems[slot];
      if (eqItem) return { ...eqItem, isEquipped: true, equippedSlot: slot };
    }
    if (store.inventory.length > 0) {
      const sorted = [...store.inventory].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
      if (sorted[0]) return { ...sorted[0], isEquipped: false };
    }
    return null;
  };

  const activeSelectedItem = selectedItem || getFirstItemAvailable();

  const equippedList = Object.entries(store.equippedItems)
    .filter(([_, item]) => !!item)
    .map(([slot, item]) => ({
      ...item,
      isEquipped: true,
      equippedSlot: slot as EquipmentSlot,
      slotIndex: -1
    }));

  const inventoryList = store.inventory.map(item => ({
    ...item,
    isEquipped: false
  }));

  const matchesCategory = (item: any) => {
    if (backpackTab === 'all') return true;
    if (backpackTab === 'equipment') {
      return ['weapon', 'armor', 'accessory', 'equipment', 'cape', 'mount', 'pet', 'costume'].includes(item.type || '');
    }
    if (backpackTab === 'consumable') return item.type === 'consumable';
    if (backpackTab === 'material') return ['material', 'quest'].includes(item.type || '') || !item.type;
    return true;
  };

  const filteredEquipped = equippedList.filter(matchesCategory);
  const filteredInventory = inventoryList.filter(matchesCategory);
  const totalDisplayItems = [...filteredEquipped, ...filteredInventory];

  const displaySlotsCount = Math.max(24, Math.ceil(totalDisplayItems.length / 4) * 4);
  const gridSlots = Array.from({ length: displaySlotsCount }, (_, idx) => totalDisplayItems[idx] || null);

  return (
    <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full p-2.5 md:p-4 gap-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black md:rounded-3xl border border-slate-800 shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)]">
      {/* Header Hero Panel */}
      <div className="flex-shrink-0 flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner select-none gap-2">
        <button 
          onClick={() => {
            triggerHaptic(15);
            setActiveTab('status');
          }}
          className="px-3.5 py-1.5 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-xs rounded-lg border-2 border-emerald-950 shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] active:scale-95 transition-all text-shadow-md cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span>⬅</span>
        </button>

        <div className="bg-gradient-to-b from-red-650 to-red-800 border-2 border-amber-500 px-6 py-1 rounded shadow-[0_3px_10px_rgba(0,0,0,0.6)] transform -skew-x-2">
          <h1 className="text-white font-black text-xs md:text-sm uppercase tracking-wider font-serif text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
            Inventario Mozo
          </h1>
        </div>
        <div className="w-10 h-2" />
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Detail Section */}
        {activeSelectedItem ? (() => {
          const itemIcon = activeSelectedItem.icon || itemDetailsDb[activeSelectedItem.id]?.icon || '📦';
          const itemDesc = activeSelectedItem.description || itemDetailsDb[activeSelectedItem.id]?.desc || 'Objeto recolectado en tu trayecto por Rune Midgard.';
          const itemRarity = activeSelectedItem.rarity || itemDetailsDb[activeSelectedItem.id]?.rarity || 'common';
          const itemStatsDesc = activeSelectedItem.statsDesc || itemDetailsDb[activeSelectedItem.id]?.statsDesc;
          const isEquipable = ['weapon', 'armor', 'accessory', 'equipment', 'cape', 'mount', 'pet', 'costume'].includes(activeSelectedItem.type || '');
          const powerVal = itemRarity === 'epic' ? '+35' : itemRarity === 'rare' ? '+15' : '+5';
          let elementSymbol = '💧';
          if (activeSelectedItem.id.includes('potion')) elementSymbol = '🧪';
          else if (activeSelectedItem.id.includes('sword') || activeSelectedItem.id.includes('katar')) elementSymbol = '🔥';
          else if (activeSelectedItem.id.includes('crown') || activeSelectedItem.id.includes('angel')) elementSymbol = '⚡';
          else if (activeSelectedItem.id.includes('shield')) elementSymbol = '🛡️';

          return (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 md:p-3.5 flex flex-col sm:flex-row gap-3.5 shadow-xl relative overflow-hidden shrink-0">
              <div className="flex-shrink-0 flex justify-center items-center">
                <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-xl border-[4px] border-amber-900 bg-amber-950/40 p-1 flex items-center justify-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.85),_0_2px_8px_rgba(0,0,0,0.5)]">
                  <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 to-amber-950/80 rounded flex items-center justify-center">
                    <span className="text-3xl md:text-5xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] select-none animate-[pulse_4s_infinite]">
                      {itemIcon}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div>
                    <h3 className="text-amber-400 font-black text-sm md:text-base uppercase tracking-wider drop-shadow-md leading-tight">
                      {activeSelectedItem.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1 rounded-xl border border-slate-800 shadow-inner select-none">
                    <span className="text-base select-none">{elementSymbol}</span>
                    <span className="text-lg font-black text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] leading-none">
                      {powerVal}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-amber-100 to-amber-250 border-l-[3.5px] border-amber-800 p-2 rounded shadow-md text-amber-950 text-[10px] md:text-[11px] leading-relaxed font-sans font-medium relative overflow-hidden">
                  <p className="font-extrabold text-amber-900 uppercase text-[8px] tracking-wider mb-0.5 leading-none select-none">Atributos y Lore:</p>
                  <p className="font-extrabold text-slate-950 mb-0.5 leading-tight">{itemStatsDesc || 'Otorga un óptimo rendimiento en el campo de batalla.'}</p>
                  <p className="text-amber-850 italic text-[9px] md:text-[10px]">"{itemDesc}"</p>
                </div>

                <div className="flex gap-2.5 pt-1.5 justify-end">
                  <button onClick={() => handleDiscard(activeSelectedItem)} className="flex-1 max-w-[110px] bg-gradient-to-b from-lime-500 to-emerald-600 font-black text-[10px] py-2 px-3 rounded-full text-white uppercase">Vender</button>
                  {activeSelectedItem.isEquipped ? (
                    <button onClick={() => handleUnequip(activeSelectedItem.equippedSlot, activeSelectedItem.name)} className="flex-1 max-w-[130px] bg-gradient-to-b from-rose-500 to-red-650 font-black text-[10px] py-2 px-3 rounded-full text-white uppercase">Remover</button>
                  ) : isEquipable ? (
                    <button onClick={() => handleEquip(activeSelectedItem)} className="flex-1 max-w-[130px] bg-gradient-to-b from-fuchsia-500 to-purple-700 font-black text-[10px] py-2 px-3 rounded-full text-white uppercase">Equipar</button>
                  ) : activeSelectedItem.type === 'consumable' ? (
                    <button onClick={() => handleUseConsumable(activeSelectedItem)} className="flex-1 max-w-[130px] bg-gradient-to-b from-fuchsia-500 to-purple-700 font-black text-[10px] py-2 px-3 rounded-full text-white uppercase">Usar</button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-500 font-bold tracking-widest uppercase">
            Mochila vacía.
          </div>
        )}

        {/* Categories toggles */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-1.5 md:p-2 rounded-xl shadow-md select-none">
          <button onClick={() => { triggerHaptic(12); setBackpackTab('all'); }} className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${backpackTab === 'all' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Todo</button>
          <button onClick={() => { triggerHaptic(12); setBackpackTab('equipment'); }} className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${backpackTab === 'equipment' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Equipos</button>
          <button onClick={() => { triggerHaptic(12); setBackpackTab('consumable'); }} className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${backpackTab === 'consumable' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Pociones</button>
          <button onClick={() => { triggerHaptic(12); setBackpackTab('material'); }} className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${backpackTab === 'material' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Varios</button>
        </div>

        {/* Grid slots */}
        <div className="flex-1 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-indigo-500/10 pb-28 md:pb-2">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pb-6">
            {gridSlots.map((item, index) => {
              const hasItem = !!item;
              const isSelected = item && activeSelectedItem && 
                ((item.isEquipped && activeSelectedItem.isEquipped && (item as any).equippedSlot === activeSelectedItem.equippedSlot) ||
                 (!item.isEquipped && !activeSelectedItem.isEquipped && item.slotIndex === activeSelectedItem.slotIndex));
              const rStyle = item ? getRarityStyles(item.id) : null;
              const metaIcon = item ? (item.icon || itemDetailsDb[item.id]?.icon || '📦') : null;

              return (
                <button
                  key={`gslot-${index}`}
                  onClick={() => {
                    triggerHaptic(10);
                    if (pendingSwapFromIndex !== null) {
                      if (hasItem && !item.isEquipped && item.slotIndex !== undefined) {
                        store.swapSlots(pendingSwapFromIndex, item.slotIndex);
                        setPendingSwapFromIndex(null);
                      } else if (!hasItem) {
                        store.swapSlots(pendingSwapFromIndex, index);
                        setPendingSwapFromIndex(null);
                      }
                      return;
                    }
                    if (hasItem) setSelectedItem(item);
                    else setSelectedItem(null);
                  }}
                  onPointerDown={(e) => item && handlePointerDown(item, e)}
                  onPointerUp={(e) => item && handlePointerUp(item, e)}
                  onPointerLeave={(e) => item && handlePointerLeave(item, e)}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all active:scale-[0.93] ${
                    hasItem 
                      ? `${rStyle?.border} ${isSelected ? 'ring-2 ring-white scale-105 z-20 shadow-xl shadow-black/60' : 'shadow-inner'}` 
                      : 'bg-black/40 border-slate-900 opacity-30'
                  } ${pendingSwapFromIndex !== null && item && item.slotIndex === pendingSwapFromIndex ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}
                >
                  {hasItem && (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl md:text-3xl filter drop-shadow-md">{metaIcon}</span>
                      {(item as any).quantity > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono font-black text-amber-400 px-1 rounded-sm border border-amber-900/40">
                          {(item as any).quantity}
                        </span>
                      )}
                      {item.isEquipped && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg">
                          <span className="text-[8px] text-white font-black">E</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
