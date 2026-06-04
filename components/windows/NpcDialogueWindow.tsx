'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/lib/game/state'
import { useWindowManager, type WindowId } from '@/lib/game/windowManager'
import { BaseWindow } from '@/ui/BaseWindow'

export function NpcDialogueWindow() {
  const npcDialogue = useGameStore((s) => s.npcDialogue)
  const setPendingNpcAction = useGameStore((s) => s.setPendingNpcAction)
  const wm = useWindowManager()
  const WID: WindowId = 'npc_dialogue'

  useEffect(() => {
    if (npcDialogue) {
      wm.open(WID)
      wm.focus(WID)
    } else {
      wm.close(WID)
    }
  }, [npcDialogue])

  if (!npcDialogue) return null
  if (!wm.isOpen(WID)) return null

  return (
    <BaseWindow
      title={npcDialogue.npcName}
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => {
        setPendingNpcAction('close')
      }}
      onFocus={() => wm.focus(WID)}
      width="min(360px, calc(100vw - 48px))"
      height="auto"
    >
      <div className="p-4 min-w-[280px]">
        <p className="text-sm text-[var(--ui-text)] mb-4 leading-relaxed">
          {npcDialogue.text}
        </p>
        <div className="flex flex-col gap-2">
          {npcDialogue.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                setPendingNpcAction(opt.actionParam)
              }}
              className="w-full px-4 py-2 text-sm text-left rounded
                bg-[var(--ui-parchment)] hover:bg-[var(--ui-parchment-dark)]
                border border-[var(--ui-border)] 
                transition-all duration-100 active:scale-95"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </BaseWindow>
  )
}
