'use client'

import React, { useEffect, useState } from 'react'
import { BaseWindow } from '@/ui/BaseWindow'
import { useWindowManager, type WindowId } from '@/lib/game/windowManager'
import { useGameStore } from '@/lib/game/state'
import { ShoppingBag, DollarSign, X } from 'lucide-react'

type ShopTab = 'comprar' | 'vender'

export function ShopWindow() {
  const wm = useWindowManager()
  const WID: WindowId = 'shop'
  const shopOpen = useGameStore((s) => s.shopOpen)
  const shopItems = useGameStore((s) => s.shopItems)
  const zeny = useGameStore((s) => s.zeny)
  const stats = useGameStore((s) => s.stats)
  const jobClass = useGameStore((s) => s.jobClass)
  const inventory = useGameStore((s) => s.inventory)
  const buyShopItem = useGameStore((s) => s.buyShopItem)
  const sellItem = useGameStore((s) => s.sellItem)
  const closeShop = useGameStore((s) => s.closeShop)

  const [tab, setTab] = useState<ShopTab>('comprar')

  useEffect(() => {
    if (shopOpen) {
      wm.open(WID)
      wm.focus(WID)
    } else {
      wm.close(WID)
    }
  }, [shopOpen])

  const canBuy = (item: typeof shopItems[0]) => {
    if (item.levelReq && stats.level < item.levelReq) return false
    if (item.allowedJobs && !item.allowedJobs.includes(jobClass)) return false
    if (zeny < item.price) return false
    return true
  }

  const statText = (item: typeof shopItems[0]) => {
    if (!item.stats) return ''
    return Object.entries(item.stats)
      .map(([k, v]) => `${k.toUpperCase()} +${v}`)
      .join(', ')
  }

  return (
    <BaseWindow
      title="Tienda"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => {
        closeShop()
        wm.close(WID)
      }}
      onFocus={() => wm.focus(WID)}
      width="min(440px, calc(100vw - 48px))"
      height="auto"
    >
      <div className="p-3">
        {/* Zeny bar */}
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[var(--ui-parchment-dark)] rounded border border-[var(--ui-border)]">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-yellow-600">{zeny} Zeny</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setTab('comprar')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tab === 'comprar' 
                  ? 'bg-[var(--ui-primary)] text-white' 
                  : 'bg-[var(--ui-parchment)] text-[var(--ui-text)] hover:bg-[var(--ui-parchment-dark)]'
              }`}
            >
              Comprar
            </button>
            <button
              onClick={() => setTab('vender')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                tab === 'vender' 
                  ? 'bg-[var(--ui-primary)] text-white' 
                  : 'bg-[var(--ui-parchment)] text-[var(--ui-text)] hover:bg-[var(--ui-parchment-dark)]'
              }`}
            >
              Vender
            </button>
          </div>
        </div>

        {/* Tab content */}
        {tab === 'comprar' && (
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {shopItems.length === 0 && (
              <div className="text-center py-8 text-[var(--ui-text-muted)] text-sm">
                No hay productos disponibles.
              </div>
            )}
            {shopItems.map((item) => {
              const affordable = zeny >= item.price
              const meetsLevel = !item.levelReq || stats.level >= item.levelReq
              const meetsJob = !item.allowedJobs || item.allowedJobs.includes(jobClass)
              const buyable = affordable && meetsLevel && meetsJob
              return (
                <div
                  key={item.itemId}
                  className={`flex items-center justify-between px-3 py-2 rounded border ${
                    buyable 
                      ? 'bg-[var(--ui-parchment)] border-[var(--ui-border)]' 
                      : 'bg-[var(--ui-parchment)]/50 border-[var(--ui-border)]/50 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-sm font-medium text-[var(--ui-text)]">{item.name}</div>
                    <div className="text-xs text-[var(--ui-text-muted)]">
                      {item.type === 'equipment' && item.slot && (
                        <span className="mr-2 uppercase text-[10px]">{item.slot}</span>
                      )}
                      {statText(item) && <span>{statText(item)}</span>}
                      {!meetsLevel && <span className="text-red-500 ml-2">Nvl {item.levelReq}+</span>}
                      {!meetsJob && <span className="text-orange-500 ml-2">Job restringido</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${affordable ? 'text-yellow-600' : 'text-red-500'}`}>
                      {item.price}Z
                    </span>
                    <button
                      onClick={() => buyShopItem(item.itemId)}
                      disabled={!buyable}
                      className="px-3 py-1 text-xs rounded bg-[var(--ui-primary)] text-white 
                        disabled:opacity-40 disabled:cursor-not-allowed
                        hover:bg-[var(--ui-primary-dark)] active:scale-95 transition-all duration-100"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'vender' && (
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {inventory.length === 0 && (
              <div className="text-center py-8 text-[var(--ui-text-muted)] text-sm">
                No tienes items para vender.
              </div>
            )}
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded border border-[var(--ui-border)] bg-[var(--ui-parchment)]"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-sm font-medium text-[var(--ui-text)]">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-[var(--ui-text-muted)] ml-1">x{item.quantity}</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ui-text-muted)] capitalize">{item.type}</div>
                </div>
                <button
                  onClick={() => sellItem(item.id)}
                  className="px-3 py-1 text-xs rounded bg-red-600 text-white 
                    hover:bg-red-700 active:scale-95 transition-all duration-100 shrink-0"
                >
                  Vender
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseWindow>
  )
}
