'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FloatingWindow({ title, isOpen, onClose, children }: FloatingWindowProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[--color-ivory-white] rounded-lg shadow-2xl border-t-2 border-x-2 border-b-4 border-[--color-gray-medium]"
            style={{
                fontFamily: 'var(--font-serif)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[--color-steel-blue] rounded-t-md text-[--color-ivory-white] border-b-2 border-[--color-steel-blue-dark]">
              <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-full flex items-center justify-center text-[--color-ivory-white] hover:bg-black/20 transition-colors"
                aria-label="Cerrar ventana"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 text-[--color-gray-dark]" style={{ fontFamily: 'sans-serif' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
