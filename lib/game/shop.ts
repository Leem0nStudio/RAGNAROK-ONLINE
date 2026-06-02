import { ShopItem } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  // Consumables
  { itemId: 'red_potion', name: 'Red Potion', price: 50, type: 'consumable' },
  { itemId: 'orange_potion', name: 'Orange Potion', price: 150, type: 'consumable' },
  { itemId: 'yellow_potion', name: 'Yellow Potion', price: 400, type: 'consumable' },
  { itemId: 'blue_potion', name: 'Blue Potion', price: 200, type: 'consumable' },
  { itemId: 'white_potion', name: 'White Potion', price: 800, type: 'consumable' },

  // Weapons
  { itemId: 'wooden_sword', name: 'Wooden Sword', price: 200, type: 'equipment', slot: 'rightHand', stats: { atk: 5 }, levelReq: 1, allowedJobs: ['Novice'] },
  { itemId: 'sword', name: 'Sword', price: 500, type: 'equipment', slot: 'rightHand', stats: { atk: 15 }, levelReq: 10, allowedJobs: ['Swordsman', 'Knight', 'Lord Knight', 'Crusader', 'Paladin'] },
  { itemId: 'staff', name: 'Staff', price: 500, type: 'equipment', slot: 'rightHand', stats: { atk: 8, matk: 12 }, levelReq: 10, allowedJobs: ['Mage', 'Wizard', 'High Wizard', 'Sage', 'Professor'] },
  { itemId: 'short_bow', name: 'Short Bow', price: 500, type: 'equipment', slot: 'rightHand', stats: { atk: 10 }, levelReq: 10, allowedJobs: ['Archer', 'Hunter', 'Sniper', 'Bard', 'Dancer', 'Clown', 'Gypsy'] },
  { itemId: 'broad_sword', name: 'Broad Sword', price: 1200, type: 'equipment', slot: 'rightHand', stats: { atk: 22 }, levelReq: 15, allowedJobs: ['Swordsman', 'Knight', 'Lord Knight'] },
  { itemId: 'arc_wand', name: 'Arc Wand', price: 1200, type: 'equipment', slot: 'rightHand', stats: { atk: 10, matk: 20 }, levelReq: 15, allowedJobs: ['Mage', 'Wizard', 'High Wizard'] },
  { itemId: 'long_bow', name: 'Long Bow', price: 1200, type: 'equipment', slot: 'rightHand', stats: { atk: 18 }, levelReq: 15, allowedJobs: ['Archer', 'Hunter', 'Sniper'] },

  // Armors
  { itemId: 'cotton_shirt', name: 'Cotton Shirt', price: 300, type: 'equipment', slot: 'body', stats: { def: 3 }, levelReq: 1 },
  { itemId: 'leather_armor', name: 'Leather Armor', price: 800, type: 'equipment', slot: 'body', stats: { def: 8 }, levelReq: 10 },
  { itemId: 'copper_armor', name: 'Copper Armor', price: 1500, type: 'equipment', slot: 'body', stats: { def: 14 }, levelReq: 15 },

  // Accessories
  { itemId: 'ring_of_life', name: 'Ring of Life', price: 400, type: 'equipment', slot: 'accessory', stats: { hp: 25 }, levelReq: 5 },
  { itemId: 'feather_brooch', name: 'Feather Brooch', price: 600, type: 'equipment', slot: 'accessory', stats: { spd: 2 }, levelReq: 10 },
  { itemId: 'leather_boots', name: 'Leather Boots', price: 200, type: 'equipment', slot: 'accessory', stats: { spd: 2, def: 1 }, levelReq: 5 },

  // Bosque Umbrío Equipment
  { itemId: 'bat_hood', name: 'Capucha de Murciélago', price: 2500, type: 'equipment', slot: 'head', stats: { agi: 2 }, levelReq: 18 },
  { itemId: 'spore_cap', name: 'Sombrero de Spore', price: 2200, type: 'equipment', slot: 'head', stats: { int: 1, def: 1 }, levelReq: 18 },
  { itemId: 'wisp_circlet', name: 'Aro de Fuego Fatuo', price: 2800, type: 'equipment', slot: 'head', stats: { matk: 2 }, levelReq: 20 },
  { itemId: 'shadow_veil', name: 'Velo de Sombra', price: 3000, type: 'equipment', slot: 'head', stats: { flee: 3 }, levelReq: 22 },
  { itemId: 'ancient_crown', name: 'Corona Ancestral', price: 5000, type: 'equipment', slot: 'head', stats: { hp: 100, def: 2 }, levelReq: 25 },
  { itemId: 'shadow_robe', name: 'Túnica Sombría', price: 2800, type: 'equipment', slot: 'body', stats: { def: 12, flee: 3 }, levelReq: 20 },
  { itemId: 'silk_armor', name: 'Armadura de Seda', price: 3200, type: 'equipment', slot: 'body', stats: { def: 16, spd: 1 }, levelReq: 22 },
  { itemId: 'ancient_plate', name: 'Coraza Ancestral', price: 4500, type: 'equipment', slot: 'body', stats: { def: 22, hp: 50 }, levelReq: 25 },
  { itemId: 'shadow_blade', name: 'Espada Sombría', price: 4000, type: 'equipment', slot: 'rightHand', stats: { atk: 28, agi: 2 }, levelReq: 22, allowedJobs: ['Swordsman', 'Knight', 'Lord Knight', 'Assassin', 'Assassin Cross'] },
  { itemId: 'nature_staff', name: 'Báculo Natural', price: 3800, type: 'equipment', slot: 'rightHand', stats: { atk: 12, matk: 28 }, levelReq: 22, allowedJobs: ['Mage', 'Wizard', 'High Wizard', 'Sage', 'Professor'] },
  { itemId: 'ancient_bow', name: 'Arco Ancestral', price: 3800, type: 'equipment', slot: 'rightHand', stats: { atk: 24, dex: 2 }, levelReq: 22, allowedJobs: ['Archer', 'Hunter', 'Sniper', 'Bard', 'Dancer'] },
  { itemId: 'bat_ring', name: 'Anillo de Murciélago', price: 2500, type: 'equipment', slot: 'accessory', stats: { flee: 5 }, levelReq: 20 },
  { itemId: 'wisp_amulet', name: 'Amuleto de Fuego Fatuo', price: 3000, type: 'equipment', slot: 'accessory', stats: { matk: 5 }, levelReq: 22 },
  { itemId: 'ancient_seal', name: 'Sello Ancestral', price: 3500, type: 'equipment', slot: 'accessory', stats: { def: 5, hp: 50 }, levelReq: 25 },
];
