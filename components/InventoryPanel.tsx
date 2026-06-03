'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/game/state';
import type { InventoryItem, EquipmentSlot } from '@/lib/game/types';
import { itemDetailsDb } from '@/lib/game/data/items';
import { Trash2, HeartHandshake, ArrowUp } from 'lucide-react';
import { MOTION } from '@/ui/motions';
import { playUI } from '@/lib/game/audio';
import { getRarityStyles } from '@/ui/rarity';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';
import { useButtonState } from '@/ui/buttonState';

const BackpackItem = ({ item, onSelect, isSelected }: {
    item: InventoryItem;
    onSelect: () => void;
    isSelected: boolean;
}) => {
    const details = itemDetailsDb[item.id];
    const rarity = getRarityStyles(details?.rarity ?? 'common');
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={() => { playUI(); onSelect(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center justify-center relative transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
                width: 64,
                height: 64,
                borderRadius: radii.md,
                border: `2px solid ${isSelected ? colors.gold : rarity.border}`,
                backgroundColor: isSelected ? colors.goldBg : colors.overlayLight,
                fontSize: '1.75rem',
                transform: isSelected ? 'scale(1.05)' : 'none',
                filter: hovered ? 'brightness(1.1)' : 'none',
            }}
        >
            {item.type === 'card' && (
                <span
                    className="absolute font-bold font-mono"
                    style={{
                        top: 0,
                        left: 0,
                        fontSize: 9,
                        backgroundColor: colors.accentPurple,
                        color: colors.textWhite,
                        padding: '1px 4px',
                        borderRadius: `0 ${radii.sm}px 0 ${radii.sm}px`,
                        lineHeight: '12px',
                        letterSpacing: '0.5px',
                    }}
                >
                    C
                </span>
            )}
            {details?.icon ?? '❓'}
            {item.quantity > 1 && (
                <span
                    className="absolute font-bold"
                    style={{
                        bottom: 0,
                        right: 0,
                        fontSize: fontSizes.secondary,
                        backgroundColor: colors.textGrayDark,
                        color: colors.textWhite,
                        padding: '0 6px',
                        borderRadius: radii.sm,
                        lineHeight: '16px',
                    }}
                >
                    {item.quantity}
                </span>
            )}
        </button>
    );
};

export function InventoryPanel() {
    const store = useGameStore();
    const [backpackTab, setBackpackTab] = useState<'all' | 'equipment' | 'consumable' | 'material' | 'card'>('all');
    const [selectedItem, setSelectedItem] = useState<(InventoryItem & { isEquipped?: boolean; equippedSlot?: EquipmentSlot }) | null>(null);
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    const action = useButtonState();
    const unequip = useButtonState();
    const discard = useButtonState();

    const filteredInventory = useMemo(() => store.inventory.filter(item => {
        if (backpackTab === 'all') return true;
        return item.type === backpackTab;
    }), [store.inventory, backpackTab]);

    const handleItemSelect = (item: InventoryItem | Omit<InventoryItem, 'quantity'>) => {
        const equippedSlot = Object.entries(store.equippedItems)
            .find(([, invItem]) => invItem?.id === item.id)?.[0] as EquipmentSlot | undefined;
        setSelectedItem({ ...item, quantity: ('quantity' in item ? item.quantity : 1) as number, isEquipped: !!equippedSlot, equippedSlot });
    };

    const handleUse = () => {
        if (!selectedItem) return;
        if (selectedItem.type === 'equipment') {
            store.equipItem(selectedItem.id, selectedItem.slot ?? 'accessory');
        } else {
            store.drinkPotionById(selectedItem.id);
        }
        setSelectedItem(null);
    };

    const handleUnequip = () => {
        if (selectedItem && selectedItem.equippedSlot) {
            store.unequipItem(selectedItem.equippedSlot);
            setSelectedItem(null);
        }
    };

    const handleDiscard = () => {
        if (selectedItem) {
            store.discardItem(selectedItem.id, selectedItem.quantity);
            setSelectedItem(null);
        }
    };

    const TAB_LABELS: Record<string, string> = {
        all: 'Todo', equipment: 'Equipo', consumable: 'Consumible', material: 'Material', card: 'Cartas',
    };
    const tabs = ['all', 'equipment', 'consumable', 'material', 'card'] as const;

    return (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 overflow-y-auto">
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex overflow-x-auto gap-2 pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
                        {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { playUI(); setBackpackTab(tab); }}
                                    onMouseEnter={() => setHoveredTab(tab)}
                                    onMouseLeave={() => setHoveredTab(null)}
                                    className="font-bold rounded-full border transition-all duration-100 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        padding: `4px ${spacing.lg}px`,
                                        fontSize: fontSizes.secondary,
                                        backgroundColor: backpackTab === tab ? colors.accentIndigo : (hoveredTab === tab ? colors.borderBlackLight : colors.glassCard),
                                        color: backpackTab === tab ? colors.textWhite : colors.textGrayLow,
                                        borderColor: backpackTab === tab ? 'transparent' : colors.borderBlackLight,
                                        filter: hoveredTab === tab && backpackTab !== tab ? 'brightness(1.1)' : 'none',
                                    }}
                            >
                                {TAB_LABELS[tab]}
                            </button>
                        ))}
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={backpackTab}
                            className="flex-1 min-h-[160px] overflow-y-auto pr-1"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))',
                                gap: spacing.sm,
                            }}
                            variants={MOTION.fadeSlide.variants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={MOTION.fadeSlide.transition}
                        >
                            {filteredInventory.length === 0 ? (
                                <div className="flex items-center justify-center col-span-full" style={{ minHeight: 160 }}>
                                    <p style={{ color: colors.textMuted, fontSize: fontSizes.normal }}>
                                        No hay objetos en esta categoría.
                                    </p>
                                </div>
                            ) : (
                                filteredInventory.map(item => (
                                    <BackpackItem
                                        key={item.id}
                                        item={item}
                                        onSelect={() => handleItemSelect(item)}
                                        isSelected={selectedItem?.id === item.id}
                                    />
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {selectedItem && itemDetailsDb[selectedItem.id] && (
                <div
                    className="flex flex-col justify-between overflow-y-auto"
                    style={{
                        width: '100%',
                        maxWidth: 320,
                        padding: spacing.xl,
                        backgroundColor: colors.borderBlackLight,
                    borderTop: `2px solid ${colors.borderBlackLight}`,
                    borderLeft: 'none',
                    }}
                >
                    <div>
                        <div className="flex gap-4 items-start mb-4">
                            <div
                                className="flex items-center justify-center shrink-0"
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: radii.md,
                                    border: `2px solid ${getRarityStyles(itemDetailsDb[selectedItem.id]?.rarity).border}`,
                                    backgroundColor: colors.overlayLight,
                                    fontSize: '2rem',
                                }}
                            >
                                {itemDetailsDb[selectedItem.id]?.icon}
                            </div>
                            <div>
                                <h3
                                    className="font-bold"
                                    style={{
                                        fontSize: fontSizes.name,
                                        color: getRarityStyles(itemDetailsDb[selectedItem.id]?.rarity).color,
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
                                        backgroundColor: getRarityStyles(itemDetailsDb[selectedItem.id]?.rarity).badge,
                                        color: getRarityStyles(itemDetailsDb[selectedItem.id]?.rarity).color,
                                    }}
                                >
                                    {itemDetailsDb[selectedItem.id]?.rarity.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <p className="leading-relaxed mb-4" style={{ color: colors.textGray4, fontSize: fontSizes.normal }}>
                            {itemDetailsDb[selectedItem.id]?.desc}
                        </p>
                        {selectedItem.isEquipped && (
                            <p
                                className="font-bold"
                                style={{
                                    color: colors.accentGreen,
                                    fontSize: fontSizes.secondary,
                                    padding: spacing.sm,
                                    backgroundColor: colors.accentGreenBg,
                                    borderRadius: radii.md,
                                }}
                            >
                                ✔ Equipado ({selectedItem.equippedSlot})
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        {selectedItem.type === 'consumable' && (
                            <button
                                onClick={() => { playUI(); handleUse(); }}
                                onMouseEnter={action.onMouseEnter}
                                onMouseLeave={action.onMouseLeave}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.normal,
                                    backgroundColor: colors.accentGreenBg,
                                    color: colors.accentDarkergreen,
                                    borderColor: colors.accentGreenBg,
                                    filter: action.hovered ? 'brightness(1.15)' : 'none',
                                }}
                            >
                                <HeartHandshake size={16} /> Usar
                            </button>
                        )}
                        {selectedItem.type === 'equipment' && !selectedItem.isEquipped && (
                            <button
                                onClick={() => { playUI(); handleUse(); }}
                                onMouseEnter={action.onMouseEnter}
                                onMouseLeave={action.onMouseLeave}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.normal,
                                    backgroundColor: colors.accentBlueSoft,
                                    color: colors.accentDarkblue,
                                    borderColor: colors.accentBlueSoft,
                                    filter: action.hovered ? 'brightness(1.15)' : 'none',
                                }}
                            >
                                <ArrowUp size={16} /> Equipar
                            </button>
                        )}
                        {selectedItem.isEquipped && (
                            <button
                                onClick={() => { playUI(); handleUnequip(); }}
                                onMouseEnter={unequip.onMouseEnter}
                                onMouseLeave={unequip.onMouseLeave}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        )}
                        <button
                            onClick={() => { playUI(); handleDiscard(); }}
                            onMouseEnter={discard.onMouseEnter}
                            onMouseLeave={discard.onMouseLeave}
                            className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.secondary,
                                    color: colors.textGrayLow,
                                    filter: discard.hovered ? 'brightness(1.1)' : 'none',
                                }}
                        >
                            <Trash2 size={14} /> Descartar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
