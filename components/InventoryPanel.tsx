'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/game/state';
import type { InventoryItem, EquipmentSlot } from '@/lib/game/types';
import { itemDetailsDb } from '@/lib/game/data/items';
import { Crown, Sword, Shield, Trash2, HeartHandshake, ArrowUp, Shirt, Hand } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';
import { colors, radii, fontSizes, spacing } from '@/ui/theme';

const EQUIPMENT_SLOTS: { key: EquipmentSlot; label: string; icon: React.ReactNode }[] = [
    { key: 'head', label: 'Cabeza', icon: <Crown size={24}/> },
    { key: 'body', label: 'Armadura', icon: <Shirt size={24}/> },
    { key: 'rightHand', label: 'Mano Der', icon: <Sword size={24}/> },
    { key: 'leftHand', label: 'Mano Izq', icon: <Shield size={24}/> },
    { key: 'accessory', label: 'Accesorio', icon: <Hand size={24}/> },
];

const getRarityStyles = (rarity: string) => {
    switch (rarity) {
        case 'epic': return { border: '#F59E0B', badge: 'rgba(245,158,11,0.3)', color: '#F59E0B' };
        case 'rare': return { border: '#6366F1', badge: 'rgba(99,102,241,0.3)', color: '#6366F1' };
        default: return { border: '#475569', badge: 'rgba(71,85,105,0.3)', color: '#94A3B8' };
    }
};

const BackpackItem = ({ item, onSelect, isSelected }: {
    item: InventoryItem;
    onSelect: () => void;
    isSelected: boolean;
}) => {
    const details = itemDetailsDb[item.id];
    const rarity = getRarityStyles(details?.rarity ?? 'common');
    return (
        <button
            onClick={() => { try { gameAudio.playUI(); } catch {} onSelect(); }}
            className="flex items-center justify-center relative transition-all duration-100 active:scale-95"
            style={{
                width: 64,
                height: 64,
                borderRadius: radii.md,
                border: `2px solid ${isSelected ? '#F1C40F' : rarity.border}`,
                backgroundColor: isSelected ? 'rgba(241,196,15,0.15)' : 'rgba(0,0,0,0.2)',
                fontSize: '1.75rem',
                transform: isSelected ? 'scale(1.05)' : 'none',
            }}
        >
            {details?.icon ?? '❓'}
            {item.quantity > 1 && (
                <span
                    className="absolute font-bold"
                    style={{
                        bottom: 0,
                        right: 0,
                        fontSize: fontSizes.xxs,
                        backgroundColor: '#1F2937',
                        color: colors.text.white,
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

const EquipmentSlotDisplay = ({ slot, item, onSelect }: {
    slot: EquipmentSlot;
    item: Omit<InventoryItem, 'quantity'> | null;
    onSelect: (item: Omit<InventoryItem, 'quantity'>) => void;
}) => {
    const isEquipped = !!item;
    const details = item ? itemDetailsDb[item.id] : null;
    const slotDef = EQUIPMENT_SLOTS.find(s => s.key === slot);
    return (
        <div
            onClick={() => { if (isEquipped) { try { gameAudio.playUI(); } catch {} onSelect(item!); } }}
            className="flex flex-col items-center justify-center gap-1 transition-all duration-100 active:scale-95 cursor-pointer"
            style={{
                height: 80,
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: radii.md,
                border: `2px solid ${isEquipped ? '#F1C40F' : 'rgba(75,85,99,0.5)'}`,
            }}
        >
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>
                {isEquipped && details ? details.icon : (slotDef?.icon ?? '❓')}
            </span>
            <p className="font-bold uppercase tracking-wider" style={{ fontSize: fontSizes.xxs, color: '#6B7280' }}>
                {slotDef?.label ?? slot}
            </p>
        </div>
    );
};

export function InventoryPanel() {
    const store = useGameStore();
    const [backpackTab, setBackpackTab] = useState<'all' | 'equipment' | 'consumable' | 'material' | 'card'>('all');
    const [selectedItem, setSelectedItem] = useState<(InventoryItem & { isEquipped?: boolean; equippedSlot?: EquipmentSlot }) | null>(null);

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

    const tabs = ['all', 'equipment', 'consumable', 'material', 'card'] as const;

    return (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 overflow-y-auto" style={{ padding: spacing.lg }}>
                <div style={{ marginBottom: spacing.xl }}>
                    <span
                        className="font-bold uppercase tracking-wider block mb-3"
                        style={{ fontSize: '11px', color: '#6B7280' }}
                    >
                        Equipamiento
                    </span>
                            <div className="grid grid-cols-5 gap-2">
                        {EQUIPMENT_SLOTS.map(slotDef => (
                            <EquipmentSlotDisplay
                                key={slotDef.key}
                                slot={slotDef.key}
                                item={store.equippedItems[slotDef.key] ?? null}
                                onSelect={handleItemSelect}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex overflow-x-auto gap-2 pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { try { gameAudio.playUI(); } catch {} setBackpackTab(tab); }}
                                className="font-bold rounded-full border transition-all duration-100 active:scale-95 whitespace-nowrap"
                                style={{
                                    padding: `4px ${spacing.lg}px`,
                                    fontSize: fontSizes.xs,
                                    backgroundColor: backpackTab === tab ? '#4F46E5' : 'rgba(0,0,0,0.05)',
                                    color: backpackTab === tab ? colors.text.white : '#6B7280',
                                    borderColor: backpackTab === tab ? 'transparent' : 'rgba(0,0,0,0.1)',
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div
                        className="flex-1 min-h-[160px] overflow-y-auto pr-1"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))',
                            gap: spacing.sm,
                        }}
                    >
                        {filteredInventory.map(item => (
                            <BackpackItem
                                key={item.id}
                                item={item}
                                onSelect={() => handleItemSelect(item)}
                                isSelected={selectedItem?.id === item.id}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {selectedItem && itemDetailsDb[selectedItem.id] && (
                <div
                    className="flex flex-col justify-between"
                    style={{
                        width: '100%',
                        maxWidth: 320,
                        padding: spacing.xl,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                    borderTop: '2px solid rgba(0,0,0,0.1)',
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
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    fontSize: '2rem',
                                }}
                            >
                                {itemDetailsDb[selectedItem.id]?.icon}
                            </div>
                            <div>
                                <h3
                                    className="font-bold"
                                    style={{
                                        fontSize: fontSizes.lg,
                                        color: getRarityStyles(itemDetailsDb[selectedItem.id]?.rarity).color,
                                    }}
                                >
                                    {selectedItem.name}
                                </h3>
                                <span
                                    className="font-bold"
                                    style={{
                                        fontSize: fontSizes.xxs,
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
                        <p className="text-xs leading-relaxed mb-4" style={{ color: '#4B5563' }}>
                            {itemDetailsDb[selectedItem.id]?.desc}
                        </p>
                        {selectedItem.isEquipped && (
                            <p
                                className="text-xs font-bold"
                                style={{
                                    color: '#16A34A',
                                    padding: spacing.sm,
                                    backgroundColor: 'rgba(22,163,74,0.1)',
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
                                onClick={() => { try { gameAudio.playUI(); } catch {} handleUse(); }}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.sm,
                                    backgroundColor: 'rgba(22,163,74,0.2)',
                                    color: '#166534',
                                    borderColor: 'rgba(22,163,74,0.2)',
                                }}
                            >
                                <HeartHandshake size={16} /> Usar
                            </button>
                        )}
                        {selectedItem.type === 'equipment' && !selectedItem.isEquipped && (
                            <button
                                onClick={() => { try { gameAudio.playUI(); } catch {} handleUse(); }}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.sm,
                                    backgroundColor: 'rgba(14,165,233,0.2)',
                                    color: '#0C4A6E',
                                    borderColor: 'rgba(14,165,233,0.2)',
                                }}
                            >
                                <ArrowUp size={16} /> Equipar
                            </button>
                        )}
                        {selectedItem.isEquipped && (
                            <button
                                onClick={() => { try { gameAudio.playUI(); } catch {} handleUnequip(); }}
                                className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.sm,
                                    backgroundColor: 'rgba(245,158,11,0.2)',
                                    color: '#92400E',
                                    borderColor: 'rgba(245,158,11,0.2)',
                                }}
                            >
                                <ArrowUp size={16} /> Desequipar
                            </button>
                        )}
                        <button
                            onClick={() => { try { gameAudio.playUI(); } catch {} handleDiscard(); }}
                            className="w-full font-bold rounded-lg flex items-center justify-center gap-2 border transition-all duration-100 active:scale-95"
                                style={{
                                    padding: spacing.sm,
                                    minHeight: 48,
                                    fontSize: fontSizes.xs,
                                    color: '#6B7280',
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
