'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '../state'

export function PortalPrompt() {
  const activePortal = useGameStore((s) => s.activePortal)

  return (
    <AnimatePresence>
      {activePortal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-1/3 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
        >
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center text-sm border border-white/20 shadow-lg">
            <div className="text-yellow-300 font-bold text-base mb-1">{activePortal.label}</div>
            <div className="text-white/70">Presioná E para viajar</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
