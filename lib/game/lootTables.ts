import { Entity, LootTable } from './types';

export const LOOT_TABLES: LootTable[] = [
  {
    mobType: 'poring',
    drops: [
      { itemId: 'jellopy', name: 'Jellopy', type: 'common', probability: 0.65, quantity: [1, 2], category: 'material' },
      { itemId: 'sticky_mucus', name: 'Sticky Mucus', type: 'common', probability: 0.25, quantity: [1, 1], category: 'material' },
      { itemId: 'red_potion', name: 'Red Potion', type: 'rare', probability: 0.08, quantity: [1, 1], category: 'consumable' },
      { itemId: 'poring_ear', name: 'Poring Ear', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'poring_card', name: 'Poring Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'lunatic',
    drops: [
      { itemId: 'fur', name: 'Fur', type: 'common', probability: 0.60, quantity: [1, 1], category: 'material' },
      { itemId: 'claw', name: 'Claw', type: 'common', probability: 0.30, quantity: [1, 1], category: 'material' },
      { itemId: 'orange_potion', name: 'Orange Potion', type: 'rare', probability: 0.08, quantity: [1, 1], category: 'consumable' },
      { itemId: 'lunatic_tail', name: 'Lunatic Tail', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'lunatic_card', name: 'Lunatic Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'fabre',
    drops: [
      { itemId: 'sticky_mucus', name: 'Sticky Mucus', type: 'common', probability: 0.55, quantity: [1, 2], category: 'material' },
      { itemId: 'fabre_wing', name: 'Fabre Wing', type: 'common', probability: 0.30, quantity: [1, 1], category: 'material' },
      { itemId: 'green_herb', name: 'Green Herb', type: 'rare', probability: 0.10, quantity: [1, 1], category: 'material' },
      { itemId: 'blue_potion', name: 'Blue Potion', type: 'rare', probability: 0.04, quantity: [1, 1], category: 'consumable' },
      { itemId: 'fabre_card', name: 'Fabre Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'pupa',
    drops: [
      { itemId: 'sticky_mucus', name: 'Sticky Mucus', type: 'common', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'pupa_cocoon', name: 'Capullo de Pupa', type: 'common', probability: 0.35, quantity: [1, 1], category: 'material' },
      { itemId: 'green_herb', name: 'Green Herb', type: 'rare', probability: 0.10, quantity: [1, 1], category: 'material' },
      { itemId: 'pupa_card', name: 'Pupa Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'chonchon',
    drops: [
      { itemId: 'chonchon_wing', name: 'Chonchon Wing', type: 'common', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'feeler', name: 'Feeler', type: 'common', probability: 0.35, quantity: [1, 1], category: 'material' },
      { itemId: 'yellow_potion', name: 'Yellow Potion', type: 'rare', probability: 0.08, quantity: [1, 1], category: 'consumable' },
      { itemId: 'chonchon_ear', name: 'Chonchon Ear', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'chonchon_card', name: 'Chonchon Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'picky',
    drops: [
      { itemId: 'feather', name: 'Feather', type: 'common', probability: 0.60, quantity: [1, 2], category: 'material' },
      { itemId: 'picky_egg', name: 'Picky Egg', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'material' },
      { itemId: 'orange_potion', name: 'Orange Potion', type: 'rare', probability: 0.15, quantity: [1, 1], category: 'consumable' },
      { itemId: 'picky_beak', name: 'Picky Beak', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'equipment' },
      { itemId: 'picky_card', name: 'Picky Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'pecopeco',
    drops: [
      { itemId: 'feather', name: 'Feather', type: 'common', probability: 0.55, quantity: [2, 3], category: 'material' },
      { itemId: 'pecopeco_egg', name: 'PecoPeco Egg', type: 'rare', probability: 0.20, quantity: [1, 1], category: 'material' },
      { itemId: 'yellow_potion', name: 'Yellow Potion', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'consumable' },
      { itemId: 'pecopeco_hat', name: 'PecoPeco Feather Hat', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'equipment' },
      { itemId: 'pecopeco_card', name: 'PecoPeco Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'savage_baby',
    drops: [
      { itemId: 'savage_tooth', name: 'Savage Tooth', type: 'common', probability: 0.55, quantity: [1, 1], category: 'material' },
      { itemId: 'leather', name: 'Leather', type: 'common', probability: 0.30, quantity: [1, 1], category: 'material' },
      { itemId: 'orange_potion', name: 'Orange Potion', type: 'rare', probability: 0.10, quantity: [1, 1], category: 'consumable' },
      { itemId: 'savage_tail', name: 'Savage Baby Tail', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'equipment' },
      { itemId: 'savage_baby_card', name: 'Savage Baby Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'mandragora',
    drops: [
      { itemId: 'mandragora_root', name: 'Mandragora Root', type: 'common', probability: 1.00, quantity: [1, 1], category: 'material' },
      { itemId: 'mandragora_seed', name: 'Mandragora Seed', type: 'rare', probability: 0.60, quantity: [1, 2], category: 'material' },
      { itemId: 'mandragora_flower', name: 'Mandragora Flower', type: 'rare', probability: 0.35, quantity: [1, 1], category: 'material' },
      { itemId: 'green_potion', name: 'Green Potion', type: 'rare', probability: 0.25, quantity: [1, 1], category: 'consumable' },
      { itemId: 'mandragora_crown', name: 'Mandragora Crown', type: 'epic', probability: 0.10, quantity: [1, 1], category: 'equipment' },
      { itemId: 'mandragora_card', name: 'Mandragora Card', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'drainliar',
    drops: [
      { itemId: 'bat_wing', name: 'Ala de Drainliar', type: 'common', probability: 0.60, quantity: [1, 2], category: 'material' },
      { itemId: 'sticky_mucus', name: 'Sticky Mucus', type: 'common', probability: 0.20, quantity: [1, 1], category: 'material' },
      { itemId: 'yellow_potion', name: 'Yellow Potion', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'consumable' },
      { itemId: 'bat_hood', name: 'Capucha de Murciélago', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'drainliar_card', name: 'Drainliar Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'spore',
    drops: [
      { itemId: 'spore_powder', name: 'Polvo de Spore', type: 'common', probability: 0.55, quantity: [1, 2], category: 'material' },
      { itemId: 'green_herb', name: 'Green Herb', type: 'common', probability: 0.25, quantity: [1, 1], category: 'material' },
      { itemId: 'green_potion', name: 'Green Potion', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'consumable' },
      { itemId: 'spore_cap', name: 'Sombrero de Spore', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'spore_card', name: 'Spore Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'will_o_wisp',
    drops: [
      { itemId: 'wisp_essence', name: 'Esencia de Fuego Fatuo', type: 'common', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'bat_wing', name: 'Ala de Drainliar', type: 'common', probability: 0.25, quantity: [1, 1], category: 'material' },
      { itemId: 'blue_potion', name: 'Blue Potion', type: 'rare', probability: 0.18, quantity: [1, 1], category: 'consumable' },
      { itemId: 'wisp_circlet', name: 'Aro de Fuego Fatuo', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'equipment' },
      { itemId: 'will_o_wisp_card', name: 'Will o\' Wisp Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'argiope',
    drops: [
      { itemId: 'silk_thread', name: 'Hilo de Seda', type: 'common', probability: 0.55, quantity: [1, 2], category: 'material' },
      { itemId: 'claw', name: 'Claw', type: 'common', probability: 0.25, quantity: [1, 1], category: 'material' },
      { itemId: 'orange_potion', name: 'Orange Potion', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'consumable' },
      { itemId: 'silk_armor', name: 'Armadura de Seda', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'argiope_card', name: 'Argiope Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'shining_plant',
    drops: [
      { itemId: 'glowing_sap', name: 'Savia Brillante', type: 'common', probability: 0.60, quantity: [1, 1], category: 'material' },
      { itemId: 'green_herb', name: 'Green Herb', type: 'common', probability: 0.20, quantity: [1, 2], category: 'material' },
      { itemId: 'white_potion', name: 'White Potion', type: 'rare', probability: 0.12, quantity: [1, 1], category: 'consumable' },
      { itemId: 'nature_staff', name: 'Báculo Natural', type: 'epic', probability: 0.015, quantity: [1, 1], category: 'equipment' },
      { itemId: 'shining_plant_card', name: 'Shining Plant Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'stalker',
    drops: [
      { itemId: 'shadow_shard', name: 'Fragmento de Sombra', type: 'common', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'feeler', name: 'Feeler', type: 'common', probability: 0.25, quantity: [1, 1], category: 'material' },
      { itemId: 'awakening_potion', name: 'Awakening Potion', type: 'rare', probability: 0.15, quantity: [1, 1], category: 'consumable' },
      { itemId: 'shadow_veil', name: 'Velo de Sombra', type: 'epic', probability: 0.02, quantity: [1, 1], category: 'equipment' },
      { itemId: 'stalker_card', name: 'Stalker Card', type: 'epic', probability: 0.005, quantity: [1, 1], category: 'card' },
    ],
  },
  {
    mobType: 'master_drainliar',
    drops: [
      { itemId: 'bat_wing', name: 'Ala de Drainliar', type: 'common', probability: 0.80, quantity: [2, 3], category: 'material' },
      { itemId: 'dark_crystal', name: 'Cristal Oscuro', type: 'rare', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'shadow_blade', name: 'Espada Sombría', type: 'epic', probability: 0.15, quantity: [1, 1], category: 'equipment' },
      { itemId: 'bat_ring', name: 'Anillo de Murciélago', type: 'epic', probability: 0.12, quantity: [1, 1], category: 'equipment' },
      { itemId: 'white_potion', name: 'White Potion', type: 'rare', probability: 0.30, quantity: [2, 3], category: 'consumable' },
    ],
  },
  {
    mobType: 'dark_guardian',
    drops: [
      { itemId: 'dark_crystal', name: 'Cristal Oscuro', type: 'common', probability: 0.70, quantity: [1, 2], category: 'material' },
      { itemId: 'ancient_tablet', name: 'Tablilla Antigua', type: 'rare', probability: 0.50, quantity: [1, 1], category: 'material' },
      { itemId: 'ancient_plate', name: 'Coraza Ancestral', type: 'epic', probability: 0.15, quantity: [1, 1], category: 'equipment' },
      { itemId: 'ancient_crown', name: 'Corona Ancestral', type: 'epic', probability: 0.10, quantity: [1, 1], category: 'equipment' },
      { itemId: 'dark_guardian_card', name: 'Dark Guardian Card', type: 'epic', probability: 0.03, quantity: [1, 1], category: 'card' },
    ],
  },
];

export function rollLoot(mobType: Entity['mobType']): { itemId: string; name: string; quantity: number; rarity: string } | null {
  const table = LOOT_TABLES.find(t => t.mobType === mobType);
  if (!table || table.drops.length === 0) return null;
  const totalWeight = table.drops.reduce((sum, e) => sum + e.probability, 0);
  const roll = Math.random() * totalWeight;
  let cumulative = 0;
  for (const entry of table.drops) {
    cumulative += entry.probability;
    if (roll < cumulative) {
      const qty = entry.quantity[0] + Math.floor(Math.random() * (entry.quantity[1] - entry.quantity[0] + 1));
      return { itemId: entry.itemId, name: entry.name, quantity: qty, rarity: entry.type };
    }
  }
  const fallback = table.drops[table.drops.length - 1];
  return { itemId: fallback.itemId, name: fallback.name, quantity: 1, rarity: fallback.type };
}
