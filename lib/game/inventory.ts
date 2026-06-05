import { JobClass, EquipmentSlot } from './types';

// Rarity Definitions
export type ItemRarity = 'normal' | 'rare' | 'epic';

// Item Type Definitions as requested
export type ItemType = 'consumable' | 'weapon' | 'armor' | 'accessory' | 'material' | 'quest' | 'equipment';

// Template for items loaded from databases/catalogs
export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name, e.g. "Sword", "FlaskConical", "Gem", etc.
  type: ItemType;
  rarity: ItemRarity;
  weight: number;      // weight per unit
  maxStack: number;    // maximum stack capacity per slot
  sellValue: number;   // sell price to NPCs
  allowedJobs?: JobClass[];
  slot?: EquipmentSlot; // If gear, which slot it goes to
  stats?: {
    str?: number;
    agi?: number;
    vit?: number;
    int?: number;
    dex?: number;
    luk?: number;
    atk?: number;
    def?: number;
    hit?: number;
    flee?: number;
    aspd?: number;
    maxHp?: number;
    maxSp?: number;
  };
  metadata: Record<string, any>; // Extensible metadata
}

// Representing a single item in a specific inventory slot
export interface InventorySlotItem {
  id: string;              // Matches template id (e.g. 'red_potion')
  slotIndex: number;       // Grid index from 0 to MAX_SLOTS - 1
  quantity: number;
  instanceId: string;      // Unique id for this stack/instance
  type: ItemType;          // Kept at slot level for easy access
  stats?: {
    str?: number;
    agi?: number;
    vit?: number;
    int?: number;
    dex?: number;
    luk?: number;
    atk?: number;
    def?: number;
    hit?: number;
    flee?: number;
    aspd?: number;
    maxHp?: number;
    maxSp?: number;
  };
  metadata: Record<string, any>; // Extensible metadata overrides
}

// Complete Catalog Database of Game Items
export const ITEM_DATABASE: Record<string, ItemTemplate> = {
  // Consumables
  'red_potion': {
    id: 'red_potion',
    name: 'Red Potion',
    description: 'A potion brewed from red herbs. Restores 25% of Max HP and +10 * VIT.',
    icon: 'Wine',
    type: 'consumable',
    rarity: 'normal',
    weight: 2,
    maxStack: 100,
    sellValue: 15,
    metadata: { healPercent: 0.25, healVitMult: 10 }
  },
  'hp_potion': {
    id: 'hp_potion',
    name: 'HP Potion',
    description: 'A high-potency tonic that regenerates 50% of your maximum HP andVIT * 15.',
    icon: 'Wine',
    type: 'consumable',
    rarity: 'rare',
    weight: 3,
    maxStack: 50,
    sellValue: 45,
    metadata: { healPercent: 0.50, healVitMult: 15 }
  },
  'sp_potion': {
    id: 'sp_potion',
    name: 'SP Potion',
    description: 'A glowing blue elixir that restores 40% of your maximum SP and INT * 8.',
    icon: 'Wine',
    type: 'consumable',
    rarity: 'rare',
    weight: 3,
    maxStack: 55,
    sellValue: 60,
    metadata: { healSpPercent: 0.40, healIntMult: 8 }
  },
  'panacea': {
    id: 'panacea',
    name: 'Panacea',
    description: 'A miraculous potion that clears all negative status effects and recovers 15% Max HP.',
    icon: 'Droplets',
    type: 'consumable',
    rarity: 'epic',
    weight: 1,
    maxStack: 20,
    sellValue: 250,
    metadata: { cleanseStatusEffects: true, healPercent: 0.15 }
  },
  'royal_tea': {
    id: 'royal_tea',
    name: 'Royal Tea',
    description: 'Elegant tea served to royalty. Promotes magical study (+7 INT, +5 DEX) for 60 seconds.',
    icon: 'Coffee',
    type: 'consumable',
    rarity: 'rare',
    weight: 2,
    maxStack: 20,
    sellValue: 150,
    metadata: { 
      buffId: 'royal_tea_buff', 
      buffName: 'Royal Tea', 
      duration: 60000, 
      buffIcon: '🍵', 
      stats: { int: 7, dex: 5 }, 
      description: 'Casteos y magia aumentados por Té de Reyes' 
    }
  },
  'marmalade': {
    id: 'marmalade',
    name: 'Marmalade',
    description: 'Sweet energy marmalade. Increases physical battle potency (+8 STR, +6 VIT) for 60 seconds.',
    icon: 'Cookie',
    type: 'consumable',
    rarity: 'rare',
    weight: 2,
    maxStack: 20,
    sellValue: 150,
    metadata: { 
      buffId: 'marmalade_buff', 
      buffName: 'Energy Marmalade', 
      duration: 60000, 
      buffIcon: '🍯', 
      stats: { str: 8, vit: 6 }, 
      description: 'Fuerza física aumentada por mermelada dulce' 
    }
  },
  'wind_scroll': {
    id: 'wind_scroll',
    name: 'Wind Scroll',
    description: 'A parchment glowing with gale magic. Grants Haste (+40 ASPD) for 30 seconds.',
    icon: 'Scroll',
    type: 'consumable',
    rarity: 'epic',
    weight: 1,
    maxStack: 15,
    sellValue: 300,
    metadata: { 
      buffId: 'wind_scroll_buff', 
      buffName: 'Wind Scroll', 
      duration: 30000, 
      buffIcon: '📜', 
      stats: { aspd: 40, agi: 10 }, 
      description: 'Velocidad de ataque y movimiento incrementadas' 
    }
  },
  'shield_scroll': {
    id: 'shield_scroll',
    name: 'Shield Scroll',
    description: 'A protective runic scroll. Extends massive static defense (+30 DEF) for 45 seconds.',
    icon: 'Scroll',
    type: 'consumable',
    rarity: 'epic',
    weight: 1,
    maxStack: 15,
    sellValue: 300,
    metadata: { 
      buffId: 'shield_scroll_buff', 
      buffName: 'Shield Scroll', 
      duration: 45000, 
      buffIcon: '🛡️', 
      stats: { def: 30 }, 
      description: 'Firme coraza defensiva de pergamino mágico' 
    }
  },
  'mystery_scroll': {
    id: 'mystery_scroll',
    name: 'Mystery Scroll',
    description: 'A chaotic ancient scroll. Casting it invokes random magic or special rewards.',
    icon: 'Scroll',
    type: 'consumable',
    rarity: 'epic',
    weight: 1,
    maxStack: 10,
    sellValue: 500,
    metadata: { specialEffect: 'mystery_random' }
  },
  'awakening_potion': {
    id: 'awakening_potion',
    name: 'Awakening Potion',
    description: 'Increases local attack adrenaline, boosting ASPD (+15%) temporarily.',
    icon: 'FlaskConical',
    type: 'consumable',
    rarity: 'rare',
    weight: 5,
    maxStack: 10,
    sellValue: 120,
    metadata: { 
      buffId: 'awakening_potion_buff', 
      buffName: 'Awakening Buff', 
      duration: 35000, 
      buffIcon: '⚡', 
      stats: { aspd: 15 }, 
      description: 'ASPD incrementado notablemente' 
    }
  },
  
  // Weapons
  'iron_sword': {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A balanced single-handed sword forged with high grade pig iron.',
    icon: 'Sword',
    type: 'weapon',
    rarity: 'normal',
    weight: 45,
    maxStack: 1,
    sellValue: 75,
    slot: 'rightHand',
    stats: { atk: 18 },
    metadata: { weaponType: 'one-handed-sword' }
  },
  'legendary_katar': {
    id: 'legendary_katar',
    name: 'Assassin Katar',
    description: 'Dual-blade katar infused with shadows. Highly favors Assassins.',
    icon: 'Zap',
    type: 'weapon',
    rarity: 'epic',
    weight: 35,
    maxStack: 1,
    sellValue: 1500,
    allowedJobs: ['Assassin', 'Assassin Cross'],
    slot: 'rightHand',
    stats: { atk: 65, agi: 8 },
    metadata: { criticalChance: 0.15 }
  },

  // Armor
  'rare_armor': {
    id: 'rare_armor',
    name: "Odin's Blessing",
    description: 'A divine silver chestplate. Emits a comforting and protective golden aura.',
    icon: 'Shield',
    type: 'armor',
    rarity: 'epic',
    weight: 120,
    maxStack: 1,
    sellValue: 2000,
    slot: 'body',
    stats: { def: 25, agi: 4 },
    metadata: { holyResistance: 0.2 }
  },
  'novice_shirt': {
    id: 'novice_shirt',
    name: 'Novice Shirt',
    description: 'A lightweight tunic stitched together from rough linen.',
    icon: 'Shirt',
    type: 'armor',
    rarity: 'normal',
    weight: 15,
    maxStack: 1,
    sellValue: 5,
    slot: 'body',
    stats: { def: 3 },
    metadata: {}
  },

  // Accessory
  'clip_of_wisdom': {
    id: 'clip_of_wisdom',
    name: 'Clip of Wisdom',
    description: 'A small clip possessing deep ambient magical concentration (+5 ATK, +2 DEF). Can be equipped in accessory slots.',
    icon: 'Gem',
    type: 'accessory',
    rarity: 'rare',
    weight: 5,
    maxStack: 1,
    sellValue: 450,
    slot: 'accessory1',
    stats: { atk: 5, def: 2 },
    metadata: { slots: 1 }
  },
  
  'baphomet_cape': {
    id: 'baphomet_cape',
    name: 'Baphomet Cape',
    description: 'A dark, tattered cape emitting a malevolent aura. (+12 DEF, +5 AGI)',
    icon: 'Shirt',
    type: 'armor',
    rarity: 'epic',
    weight: 15,
    maxStack: 1,
    sellValue: 1200,
    slot: 'cape',
    stats: { def: 12, agi: 5 },
    metadata: {}
  },
  
  'pecopeco_mount': {
    id: 'pecopeco_mount',
    name: 'PecoPeco Mount',
    description: 'A swift, loyal giant desert bird. Speeds up walk routes and grants (+15 AGI).',
    icon: 'Bird',
    type: 'equipment',
    rarity: 'rare',
    weight: 0,
    maxStack: 1,
    sellValue: 800,
    slot: 'mount',
    stats: { agi: 15 },
    metadata: {}
  },
  
  'poring_pet': {
    id: 'poring_pet',
    name: 'Poring Pet Ball',
    description: 'A friendly, bouncy Poring pet that walks beside you. (+2 AGI, +5 ATK).',
    icon: 'Sparkles',
    type: 'equipment',
    rarity: 'normal',
    weight: 1,
    maxStack: 1,
    sellValue: 150,
    slot: 'pet',
    stats: { agi: 2, atk: 5 },
    metadata: {}
  },
  
  'angel_wing_costume': {
    id: 'angel_wing_costume',
    name: 'Angel Wings Costume',
    description: 'Glorious animated white wings that make you look like a heavenly protector. (+10 ATK).',
    icon: 'Sparkles',
    type: 'equipment',
    rarity: 'epic',
    weight: 0,
    maxStack: 1,
    sellValue: 5000,
    slot: 'costume',
    stats: { atk: 10 },
    metadata: {}
  },

  // Materials
  'jellopy': {
    id: 'jellopy',
    name: 'Jellopy',
    description: 'A mysterious translucent crystalline gemstone commonly dropped by Porings.',
    icon: 'Sparkles',
    type: 'material',
    rarity: 'normal',
    weight: 1,
    maxStack: 999,
    sellValue: 5,
    metadata: {}
  },
  'sticky_mucus': {
    id: 'sticky_mucus',
    name: 'Sticky Mucus',
    description: 'A viscous gel extracted from slimes. Used heavily in generic alchemy.',
    icon: 'Droplets',
    type: 'material',
    rarity: 'normal',
    weight: 1,
    maxStack: 999,
    sellValue: 8,
    metadata: {}
  },
  'steel': {
    id: 'steel',
    name: 'Steel',
    description: 'High durability alloy made by refining coal and iron together.',
    icon: 'Hammer',
    type: 'material',
    rarity: 'rare',
    weight: 10,
    maxStack: 500,
    sellValue: 250,
    metadata: {}
  },
  'mvp_coin': {
    id: 'mvp_coin',
    name: 'MVP Gold Coin',
    description: 'A sacred coin minted to commemorate incredible triumphs over MVP Raid Bosses.',
    icon: 'Coins',
    type: 'material',
    rarity: 'epic',
    weight: 2,
    maxStack: 999,
    sellValue: 5000,
    metadata: {}
  },

  // Quest
  'baphomet_horn': {
    id: 'baphomet_horn',
    name: 'Baphomet horn',
    description: 'A massive blackened horn severed from the dark MVP Lord Baphomet himself.',
    icon: 'Crown',
    type: 'quest',
    rarity: 'epic',
    weight: 25,
    maxStack: 10,
    sellValue: 10000,
    metadata: { questId: 'defeat_mvp_baphomet' }
  },
  'novice_scroll': {
    id: 'novice_scroll',
    name: 'Novice scroll',
    description: 'A sealed parchment testifying completions of the Novice Academy basic tests.',
    icon: 'Scroll',
    type: 'quest',
    rarity: 'normal',
    weight: 1,
    maxStack: 1,
    sellValue: 0,
    metadata: { questId: 'class_promotion_novice' }
  }
};

// Default Maximum Inventory Slots (Expansion friendly!)
export const INITIAL_MAX_SLOTS = 40;

/**
 * Pure, decoupled helper class that manages backend data mutations for a slot-based inventory.
 * Fully compatible with Zustand state and can run without any visual UI element initialized.
 */
export class InventoryManager {
  /**
   * Calculates the weight of a set of inventory slots
   */
  public static calculateTotalWeight(slots: InventorySlotItem[]): number {
    return slots.reduce((total, slotItem) => {
      const template = ITEM_DATABASE[slotItem.id];
      if (!template) return total;
      return total + (template.weight * slotItem.quantity);
    }, 0);
  }

  /**
   * Calculates maximum weight capacity based on character STR stat (Standard RO Formula)
   */
  public static calculateMaxWeightCapacity(str: number): number {
    return 2000 + (str * 30);
  }

  /**
   * Adds an item to a slot-based grid array, honoring stack limits and slot limits.
   * Returns the updated array of slots, success status, and details about adding.
   */
  public static addItem(
    currentSlots: InventorySlotItem[],
    itemId: string,
    quantity: number,
    maxSlots: number = INITIAL_MAX_SLOTS
  ): { slots: InventorySlotItem[]; success: boolean; added: number; error?: string } {
    const normId = itemId.trim().toLowerCase();
    const template = ITEM_DATABASE[normId];
    if (!template) {
      return { slots: currentSlots, success: false, added: 0, error: 'Item not found in catalog.' };
    }

    let remainingToAdd = quantity;
    let mutatedSlots = [...currentSlots];

    // 1. Fill existing incomplete stacks first (only if the item is stackable, i.e., maxStack > 1)
    if (template.maxStack > 1) {
      mutatedSlots = mutatedSlots.map(slot => {
        if (slot.id === normId && slot.quantity < template.maxStack && remainingToAdd > 0) {
          const spaceInSlot = template.maxStack - slot.quantity;
          const toAdd = Math.min(spaceInSlot, remainingToAdd);
          remainingToAdd -= toAdd;
          return { ...slot, quantity: slot.quantity + toAdd };
        }
        return slot;
      });
    }

    // 2. Put remaining into new empty slots
    const occupiedSlotIndices = new Set(mutatedSlots.map(s => s.slotIndex));
    
    while (remainingToAdd > 0) {
      // Find the first empty slot index
      let targetSlotIndex = -1;
      for (let index = 0; index < maxSlots; index++) {
        if (!occupiedSlotIndices.has(index)) {
          targetSlotIndex = index;
          break;
        }
      }

      if (targetSlotIndex === -1) {
        // Inventory is full!
        break;
      }

      // Add stack to that slot
      const toAddInNewSlot = Math.min(template.maxStack, remainingToAdd);
      remainingToAdd -= toAddInNewSlot;
      
      const newSlotItem: InventorySlotItem = {
        id: normId,
        slotIndex: targetSlotIndex,
        quantity: toAddInNewSlot,
        instanceId: `inst_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        type: template.type,
        stats: template.stats ? { ...template.stats } : undefined,
        metadata: template.metadata ? { ...template.metadata } : {}
      };

      mutatedSlots.push(newSlotItem);
      occupiedSlotIndices.add(targetSlotIndex);
    }

    const actuallyAdded = quantity - remainingToAdd;
    return {
      slots: mutatedSlots,
      success: actuallyAdded > 0,
      added: actuallyAdded,
      error: remainingToAdd > 0 ? 'Inventory full or partially full.' : undefined
    };
  }

  /**
   * Removes item by slot index
   */
  public static removeItemBySlotIndex(
    currentSlots: InventorySlotItem[],
    slotIndex: number,
    quantity: number
  ): { slots: InventorySlotItem[]; success: boolean; removed: number } {
    let removed = 0;
    const nextSlots = currentSlots
      .map(slot => {
        if (slot.slotIndex === slotIndex) {
          const toRemove = Math.min(slot.quantity, quantity);
          removed += toRemove;
          return { ...slot, quantity: slot.quantity - toRemove };
        }
        return slot;
      })
      .filter(slot => slot.quantity > 0); // Keep only slots with items remaining

    return { slots: nextSlots, success: removed > 0, removed };
  }

  /**
   * Safely swaps position indexes of two slots
   */
  public static swapSlots(
    currentSlots: InventorySlotItem[],
    fromIndex: number,
    toIndex: number,
    maxSlots: number = INITIAL_MAX_SLOTS
  ): InventorySlotItem[] {
    if (fromIndex < 0 || fromIndex >= maxSlots || toIndex < 0 || toIndex >= maxSlots) {
      return currentSlots;
    }

    const itemAtFrom = currentSlots.find(s => s.slotIndex === fromIndex);
    const itemAtTo = currentSlots.find(s => s.slotIndex === toIndex);

    return currentSlots.map(slot => {
      if (slot.slotIndex === fromIndex) {
        return itemAtTo ? { ...slot, slotIndex: toIndex } : { ...slot, slotIndex: toIndex };
      }
      if (slot.slotIndex === toIndex) {
        return itemAtFrom ? { ...slot, slotIndex: fromIndex } : { ...slot, slotIndex: fromIndex };
      }
      return slot;
    });
  }

  /**
   * Auto sorts and defragments the inventory starting from Slot 0.
   * Priority: Type (combat order) -> Rarity (desc) -> Name -> Quantity (desc)
   */
  public static sortAndDefragment(currentSlots: InventorySlotItem[]): InventorySlotItem[] {
    const sorted = [...currentSlots].sort((a, b) => {
      const tempA = ITEM_DATABASE[a.id];
      const tempB = ITEM_DATABASE[b.id];
      if (!tempA || !tempB) return 0;

      // Classify type numerical weight
      const typeWeights: Record<ItemType, number> = {
        weapon: 0,
        armor: 1,
        accessory: 2,
        consumable: 3,
        material: 4,
        quest: 5,
        equipment: 6
      };
      if (typeWeights[tempA.type] !== typeWeights[tempB.type]) {
        return typeWeights[tempA.type] - typeWeights[tempB.type];
      }

      // Rarity numerical weight (Epic first)
      const rarityWeights: Record<ItemRarity, number> = {
        epic: 0,
        rare: 1,
        normal: 2
      };
      if (rarityWeights[tempA.rarity] !== rarityWeights[tempB.rarity]) {
        return rarityWeights[tempA.rarity] - rarityWeights[tempB.rarity];
      }

      // Alphabetical Name
      if (tempA.name !== tempB.name) {
        return tempA.name.localeCompare(tempB.name);
      }

      // Quantity Descending
      return b.quantity - a.quantity;
    });

    // Re-index slots starting continuously from 0
    return sorted.map((slotItem, index) => ({
      ...slotItem,
      slotIndex: index
    }));
  }
}
