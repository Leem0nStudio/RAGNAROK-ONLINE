'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '../state'

const TRANSITION_DURATION = 0.5

export function MapTransitionController() {
  const transitionState = useGameStore((s) => s.transitionState)

  return (
    <AnimatePresence>
      {transitionState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: transitionState === 'fading_out' ? 1 : transitionState === 'loading' ? 1 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_DURATION }}
          className="fixed inset-0 z-[500] pointer-events-none bg-black"
        />
      )}
    </AnimatePresence>
  )
}
