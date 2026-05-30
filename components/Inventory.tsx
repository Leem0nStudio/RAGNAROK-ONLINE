'use client'

import { useState } from 'react';
import { useGameStore } from '../lib/game/state';
import { EquipmentSlot } from '../lib/game/types';
import { Backpack, X, Briefcase } from 'lucide-react';

export function Inventory() {
  const [isOpen, setIsOpen] = useState(false);
  const { inventory, equippedItems, equipItem, unequipItem } = useGameStore();

  const slots: EquipmentSlot[] = ['head', 'body', 'rightHand', 'leftHand'];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 bg-slate-900 border border-slate-700 p-3 rounded-full text-white shadow-2xl z-50 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-transform"
        aria-label="Abrir inventario"
      >
        <Backpack className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-auto text-white shadow-2xl min-h-[50vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-display font-bold flex items-center">
            <Backpack className="w-6 h-6 mr-3" /> Inventario
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Equipado</h3>
          <div className="grid grid-cols-2 gap-3">
            {slots.map(slot => (
              <div key={slot} className="border border-slate-700 p-3 rounded-xl text-xs bg-slate-800 flex flex-col justify-between">
                <span className="capitalize text-slate-500 font-bold mb-1">{slot}: </span>
                {equippedItems[slot] ? (
                  <div className="flex items-center justify-between">
                    <span className="text-white truncate font-medium">{equippedItems[slot]?.name}</span>
                    <button onClick={() => unequipItem(slot)} className="text-red-400 hover:text-red-300 ml-2 h-8 w-8 flex items-center justify-center">X</button>
                  </div>
                ) : <span className="text-slate-600 italic">Vacío</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Objetos y Equipo</h3>
          <ul className="space-y-2">
            {inventory.map(item => (
              <li key={item.id} className="flex justify-between items-center text-sm bg-slate-800 p-4 rounded-xl hover:bg-slate-700">
                <span className="truncate flex-grow mr-2 font-medium">{item.name} <span className="text-slate-400 font-normal">x{item.quantity}</span></span>
                {item.type === 'equipment' && (
                  <button 
                    onClick={() => equipItem(item.id, item.slot!)} 
                    className="bg-cyan-800 border border-cyan-600 text-white px-4 py-3 rounded-lg min-w-[80px] hover:bg-cyan-700"
                  >
                    Equipar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
