'use client';

import React, { useState } from 'react';
import { BaseWindow } from '@/ui/BaseWindow';
import { useWindowManager, type WindowId } from '@/lib/game/windowManager';
import { useGameStore } from '@/lib/game/state';
import type { EquipmentSlot } from '@/lib/game/types';
import { itemDetailsDb } from '@/lib/game/data/items';
import { Crown, Sword, Shield, Shirt, Hand, ArrowUp } from 'lucide-react';
import { playUI } from '@/lib/game/audio';
import { getRarityStyles } from '@/ui/rarity';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';
import { useButtonState } from '@/ui/buttonState';

const EQUIPMENT_SLOTS: { key: EquipmentSlot; label: string; icon: React.ReactNode }[] = [
  { key: 'head', label: 'Cabeza', icon: <Crown size={24} /> },
  { key: 'body', label: 'Armadura', icon: <Shirt size={24} /> },
  { key: 'rightHand', label: 'Mano Der', icon: <Sword size={24} /> },
  { key: 'leftHand', label: 'Mano Izq', icon: <Shield size={24} /> },
  { key: 'accessory', label: 'Accesorio', icon: <Hand size={24} /> },
];

export function EquipmentWindow() {
  const wm = useWindowManager();
  const store = useGameStore();
  const WID: WindowId = 'equipment';
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const unequip = useButtonState();

  const selectedItem = selectedSlot ? store.equippedItems[selectedSlot] : null;
  const selectedDetails = selectedItem ? itemDetailsDb[selectedItem.id] : null;

  const handleUnequip = () => {
    if (selectedSlot) {
      store.unequipItem(selectedSlot);
      setSelectedSlot(null);
    }
  };

  return (
    <BaseWindow
      title="Equipamiento"
      isOpen={wm.isOpen(WID)}
      zIndex={wm.getZIndex(WID)}
      onClose={() => wm.close(WID)}
      onFocus={() => wm.focus(WID)}
      width="min(400px, calc(100vw - 48px))"
      height="auto"
    >
      <div>
        <span
          className="font-bold uppercase tracking-wider block mb-3"
          style={{ fontSize: fontSizes.secondary, color: colors.textGrayLow }}
        >
          Equipado
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {EQUIPMENT_SLOTS.map((slotDef) => {
            const item = store.equippedItems[slotDef.key] ?? null;
            const isEquipped = !!item;
            const details = item ? itemDetailsDb[item.id] : null;
            const isSelected = selectedSlot === slotDef.key;
            return (
              <button
                key={slotDef.key}
                type="button"
                onClick={() => {
                  playUI();
                  if (isEquipped) {
                    setSelectedSlot(isSelected ? null : slotDef.key);
                  }
                }}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-100 active:scale-95"
                style={{
                  height: 80,
                  backgroundColor: isSelected ? colors.goldBg : isEquipped ? colors.accentIndigoBg : colors.overlayLight,
                  borderRadius: radii.md,
                  border: `2px solid ${isSelected ? colors.gold : isEquipped ? colors.accentIndigo : colors.borderGrayDim}`,
                  opacity: isEquipped ? 1 : 0.6,
                  cursor: isEquipped ? 'pointer' : 'default',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {isEquipped && details ? details.icon : slotDef.icon}
                </span>
                <p className="font-bold uppercase tracking-wider" style={{ fontSize: fontSizes.secondary, color: colors.textGrayLow }}>
                  {slotDef.label}
                </p>
              </button>
            );
          })}
        </div>

        {selectedSlot && selectedItem && selectedDetails && (
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.borderBlackLight,
              borderRadius: radii.md,
            }}
          >
            <div className="flex gap-4 items-start mb-4">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radii.md,
                  border: `2px solid ${getRarityStyles(selectedDetails.rarity ?? 'common').border}`,
                  backgroundColor: colors.overlayLight,
                  fontSize: '2rem',
                }}
              >
                {selectedDetails.icon}
              </div>
              <div>
                <h3
                  className="font-bold"
                  style={{
                    fontSize: fontSizes.name,
                    color: getRarityStyles(selectedDetails.rarity ?? 'common').color,
                  }}
                >
                  {selectedItem.name}
                </h3>
                <span
                  className="font-bold"
                  style={{
                    fontSize: fontSizes.secondary,
                    padding: '2px 8px',
                    borderRadius: radii.full,
                    backgroundColor: getRarityStyles(selectedDetails.rarity ?? 'common').badge,
                    color: getRarityStyles(selectedDetails.rarity ?? 'common').color,
                  }}
                >
                  {(selectedDetails.rarity ?? 'common').toUpperCase()}
                </span>
              </div>
            </div>
            <p className="leading-relaxed mb-4" style={{ color: colors.textGray4, fontSize: fontSizes.normal }}>
              {selectedDetails.desc}
            </p>
            <button
              onClick={() => { playUI(); handleUnequip(); }}
              onMouseEnter={unequip.onMouseEnter}
              onMouseLeave={unequip.onMouseLeave}
              className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
              style={{
                padding: spacing.sm,
                minHeight: 48,
                fontSize: fontSizes.normal,
                backgroundColor: colors.accentAmberBg,
                color: colors.accentAmberdark,
                borderColor: colors.accentAmberBg,
                filter: unequip.hovered ? 'brightness(1.15)' : 'none',
              }}
            >
              <ArrowUp size={16} /> Desequipar
            </button>
          </div>
        )}

        {!selectedSlot && (
          <p className="text-center" style={{ color: colors.textMuted, fontSize: fontSizes.secondary }}>
            Toca un objeto equipado para ver sus detalles.
          </p>
        )}
      </div>
    </BaseWindow>
  );
}
