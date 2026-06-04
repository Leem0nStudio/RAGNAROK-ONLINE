'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '../state'

export function NpcPrompt() {
  const nearbyNpcId = useGameStore((s) => s.nearbyNpcId)
  const nearbyNpcName = useGameStore((s) => s.nearbyNpcName)
  const npcDialogue = useGameStore((s) => s.npcDialogue)

  const show = nearbyNpcId && !npcDialogue

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-1/3 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
        >
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center text-sm border border-white/20 shadow-lg">
            <div className="text-yellow-300 font-bold text-base mb-1">{nearbyNpcName}</div>
            <div className="text-white/70">Presioná E para hablar</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
