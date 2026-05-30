'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Shield, Sword } from 'lucide-react';
import { useGameStore } from '../lib/game/state';

export function InventorySheet() {
  const store = useGameStore();

  return (
    <AnimatePresence>
      {store.showInventory && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border-t border-slate-700 w-full rounded-t-3xl p-5 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <ShoppingBag className="mr-2 text-indigo-400" /> Inventario
              </h2>
              <button 
                onClick={store.toggleInventory}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Equipment Section */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-3 bg-slate-800/50 rounded-2xl border border-slate-700">
               <div className="col-span-1 flex flex-col items-center justify-center p-3 border border-slate-700 rounded-xl bg-slate-900 text-slate-500">
                 <Shield className="w-8 h-8 mb-1" />
                 <span className="text-[10px]">Head</span>
               </div>
               <div className="col-span-1 flex flex-col items-center justify-center p-3 border border-slate-700 rounded-xl bg-slate-900 text-slate-500">
                 <Sword className="w-8 h-8 mb-1" />
                 <span className="text-[10px]">Weapon</span>
               </div>
               <div className="col-span-1 flex flex-col items-center justify-center p-3 border border-slate-700 rounded-xl bg-slate-900 text-slate-500">
                 <Shield className="w-8 h-8 mb-1" />
                 <span className="text-[10px]">Body</span>
               </div>
            </div>

            {/* Inventory Grid */}
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Artículos</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 pr-1 content-center">
              {store.inventory.length > 0 ? (
                store.inventory.map((item, idx) => (
                  <div key={idx} className="aspect-square bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center relative hover:border-indigo-500 transition-colors">
                    <span className="text-xs text-white text-center p-1 line-clamp-2">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 bg-slate-950 px-1 rounded text-[10px] text-white">x{item.quantity}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-4 flex flex-col items-center justify-center h-32 text-slate-600">
                    <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
                    <span className="text-sm font-medium text-slate-500">Mochila vacía</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
