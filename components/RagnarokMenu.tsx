'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Shield, Swords, Sparkles, Heart, Zap, 
  Crown, Plus, ArrowUp, ShoppingBag, Trash2, Sword, Activity,
  Sliders, Wand2, RefreshCw, ZapOff, Check, HeartHandshake, BookOpen
} from 'lucide-react';
import { useGameStore, JOB_TREE } from '../lib/game/state';
import { JobClass, HeadgearId, InventoryItem, EquipmentSlot } from '../lib/game/types';

// Item database containing descriptions, lore, stats and rarities
const itemDetailsDb: Record<string, { desc: string; statsDesc?: string; lore: string; rarity: 'common' | 'rare' | 'epic'; icon: string }> = {
  red_potion: {
    desc: 'Frasco cargado de un tónico extraído de hierbas dulces medicinales.',
    statsDesc: 'Recupera +25% de tu HP Máximo de forma instantánea.',
    lore: 'Un brebaje clásico del Gremio de Alquimistas indispensable para aventureros de todos los niveles.',
    rarity: 'common',
    icon: '🧪'
  },
  awakening_potion: {
    desc: 'Un elixir concentrado que energetiza violentamente el flujo circulatorio.',
    statsDesc: 'Otorga un Bono del 10% de velocidad de ataque (ASPD) por 30s.',
    lore: 'Sabor amargo con dejos de jengibre y ascuas de peñón. Úsese bajo supervisión.',
    rarity: 'rare',
    icon: '⚡'
  },
  jellopy: {
    desc: 'Pequeña sustancia cristalizada cristalina repelente al agua.',
    statsDesc: 'Material básico para misiones o canjes de Kafra.',
    lore: 'El remanente gelatinoso más famoso desechado por los Porings silvestres.',
    rarity: 'common',
    icon: '💎'
  },
  sticky_mucus: {
    desc: 'Líquido viscoso y verdoso sumamente denso.',
    statsDesc: 'Componente viscoso de elaboración.',
    lore: 'Se adhiere fuertemente a los guantes. Huele vagamente a manzana podrida.',
    rarity: 'common',
    icon: '🟢'
  },
  mvp_coin: {
    desc: 'Moneda antigua legendaria forjada en oro eterno.',
    statsDesc: 'Moneda de prestigio para héroes consagrados en Prontera.',
    lore: 'Marcada con la silueta augusta de Baphomet, reconoce a los cazadores supremos del reino.',
    rarity: 'epic',
    icon: '🪙'
  },
  iron_sword: {
    desc: 'Espada recta ligera diseñada con hierro templado de doble filo.',
    statsDesc: 'Incrementa la potencia física base: +18 ATK.',
    lore: 'Una hoja estándar de la guardia real, confiable tanto para desviar golpes como para perforar.',
    rarity: 'rare',
    icon: '🗡️'
  },
  saint_shield: {
    desc: 'Escudo pesado consagrado por sacerdotes santificados.',
    statsDesc: 'Otorga una robusta barrera defensiva física: +15 DEF.',
    lore: 'Su superficie de plata reluciente refleja las sombras de las catacumbas de Glast Heim.',
    rarity: 'rare',
    icon: '🛡️'
  },
  magician_hat: {
    desc: 'Sombrero místico bordado con hileras de runas mágicas celestiales.',
    statsDesc: 'Incrementa de forma pasiva tus sentidos: +5 DEF, +3 AGI',
    lore: 'Perteneció a un antiguo consejero real aficionado a descifrar constelaciones.',
    rarity: 'rare',
    icon: '🎩'
  },
  goggles: {
    desc: 'Lentes reforzadas diseñadas por ingenieros de Geffen.',
    statsDesc: 'Ofrece una excelente protección de ojos: +4 DEF',
    lore: 'Especialmente útiles para atravesar tormentas de arena en el desierto de Sograt.',
    rarity: 'rare',
    icon: '🥽'
  },
  bunny_band: {
    desc: 'Las legendarias orejas suaves cosidas por artesanos de Alberta.',
    statsDesc: 'Súper ligeras y flexibles: +2 DEF, +5 AGI',
    lore: 'Uno de los tocados de cabeza más codiciados por la comunidad debido a su alto valor táctico y estético.',
    rarity: 'epic',
    icon: '🐰'
  },
  ragnarok_crown: {
    desc: 'Corona aurea majestuosa otorgada al monarca supremo de Prontera.',
    statsDesc: 'Poder real amplificado: +8 DEF, +5 STR',
    lore: 'Brilla con un aura divina que inspira lealtad absoluta a sus aliados y pavor a los monstruos.',
    rarity: 'epic',
    icon: '👑'
  },
  rare_armor: {
    desc: 'Coraza pesada legendaria de aleación de platino bruñido.',
    statsDesc: 'Protección impenetrable superior: +25 DEF física.',
    lore: 'Forjada para soportar los destructivos impactos de las bestias y campeones MVP.',
    rarity: 'epic',
    icon: '👕'
  }
};

const jobInfo: Record<JobClass, { name: string; desc: string; role: string; focus: string; color: string; icon: string }> = {
  'Novice': {
    name: 'Novice',
    desc: 'Principiante en el vasto mundo de Rune-Midgard. Aprende las bases del combate y las destrezas de supervivencia.',
    role: 'Aventurero Inicial',
    focus: 'Atributos equilibrados. ¡Llega a Job Lv 10!',
    color: 'from-slate-500 to-slate-700 shadow-slate-950/40',
    icon: '👶'
  },
  'Swordsman': {
    name: 'Swordsman',
    desc: 'Guerrero novicio de la espada. Combina fuerza y defensa sólida para proteger a sus aliados.',
    role: 'Tanque Debutante',
    focus: 'Fuerza (STR) y Vitalidad (VIT), habilidades Bash',
    color: 'from-orange-600 to-red-800 shadow-orange-950/40',
    icon: '⚔️'
  },
  'Crusader': {
    name: 'Crusader',
    desc: 'Justiciero de la luz. Combina el poder sagrado con defensas impenetrables.',
    role: 'Tanque Sagrado',
    focus: 'VIT e INT para Holy Cross y Grand Cross',
    color: 'from-yellow-600 to-orange-700 shadow-yellow-950/40',
    icon: '🛡️'
  },
  'Acolyte': {
    name: 'Acolyte',
    desc: 'Devoto aprendiz de la iglesia de Prontera. Cura las heridas y apoya con bendiciones de luz.',
    role: 'Sanador de Soporte',
    focus: 'Inteligencia (INT) para curas fuertes y Holy Light',
    color: 'from-teal-600 to-emerald-800 shadow-teal-950/40',
    icon: '✨'
  },
  'Thief': {
    name: 'Thief',
    desc: 'Ágil superviviente de las sombras. Ataca con dagas veloces, esquiva con facilidad y envenena.',
    role: 'Evasor Sigiloso',
    focus: 'Agilidad (AGI) alta para esquivar y Double Attack',
    color: 'from-purple-600 to-violet-800 shadow-purple-950/40',
    icon: '🗡️'
  },
  'Rogue': {
    name: 'Rogue',
    desc: 'Bandido astuto y escurridizo. Experto en sabotaje y ataques sorpresa.',
    role: 'Especialista en Desarme',
    focus: 'STR y DEX para Back Stab y Strip',
    color: 'from-slate-700 to-stone-900 shadow-slate-950/40',
    icon: '🎭'
  },
  'Archer': {
    name: 'Archer',
    desc: 'Cazador de precisión. Domina el arco a gran distancia acribillando a sus presas velozmente.',
    role: 'Atacante a Distancia',
    focus: 'Destreza (DEX) y Agilidad (AGI) para Double Strafe',
    color: 'from-cyan-600 to-sky-800 shadow-cyan-950/40',
    icon: '🏹'
  },
  'Mage': {
    name: 'Mage',
    desc: 'Practicante de las artes arcanas. Canaliza los elementos para destruir a sus enemigos desde lejos.',
    role: 'Daño Mágico Elemental',
    focus: 'Inteligencia (INT) pura para hechizos devastadores',
    color: 'from-indigo-500 to-purple-700 shadow-indigo-950/40',
    icon: '🧙'
  },
  'Sage': {
    name: 'Sage',
    desc: 'Sabio de los elementos. Capaz de manipular la tierra y el tiempo.',
    role: 'Mago Táctico',
    focus: 'INT y DEX para manipulación de campo',
    color: 'from-amber-600 to-orange-800 shadow-amber-950/40',
    icon: '📖'
  },
  'Merchant': {
    name: 'Merchant',
    desc: 'Maestro del comercio y las finanzas. Utiliza su carrito y el peso de su oro para luchar.',
    role: 'Apoyo Económico / Físico',
    focus: 'STR y LUK para daño y Mammonite',
    color: 'from-yellow-600 to-amber-800 shadow-yellow-950/40',
    icon: '💰'
  },
  'Knight': {
    name: 'Knight',
    desc: 'El pináculo del guerrero. Un caballero acorazado con una resistencia y fuerza física sin igual.',
    role: 'Vanguardia Pesada',
    focus: 'VIT e STR para aguante masivo y Bowling Bash',
    color: 'from-orange-700 to-red-900 shadow-orange-950/40',
    icon: '🏇'
  },
  'Wizard': {
    name: 'Wizard',
    desc: 'Maestro de la magia de área. Sus hechizos pueden borrar ejércitos enteros en segundos.',
    role: 'Caster de Área (AoE)',
    focus: 'DEX para casteo rápido e INT máxima para daño',
    color: 'from-blue-700 to-indigo-900 shadow-blue-950/40',
    icon: '🔥'
  },
  'Hunter': {
    name: 'Hunter',
    desc: 'Experto rastreador y trampero. Utiliza su precisión y sus trampas para controlar el campo de batalla.',
    role: 'Tirador Táctico',
    focus: 'AGI y DEX para ataques rápidos y puntería letal',
    color: 'from-green-600 to-teal-800 shadow-green-950/40',
    icon: '🦅'
  },
  'Bard': {
    name: 'Bard',
    desc: 'Músico itinerante cuyas melodías inspiran a aliados y aterran a enemigos.',
    role: 'Apoyo Músico',
    focus: 'DEX e INT para canciones y ataques rítmicos',
    color: 'from-emerald-600 to-teal-800 shadow-emerald-950/40',
    icon: '🪕'
  },
  'Dancer': {
    name: 'Dancer',
    desc: 'Bailarina grácil de movimientos mortales. Cautiva a sus presas antes de eliminarlas.',
    role: 'Apoyo / DPS Evasivo',
    focus: 'AGI y DEX para bailes y latigazos',
    color: 'from-rose-600 to-pink-800 shadow-rose-950/40',
    icon: '💃'
  },
  'Priest': {
    name: 'Priest',
    desc: 'Sumo devoto de la iglesia. Especialista en resurrección, exorcismo y curación masiva.',
    role: 'Soporte Divino',
    focus: 'INT y DEX para curas rápidas y buffs',
    color: 'from-sky-400 to-blue-600 shadow-sky-950/40',
    icon: '⛪'
  },
  'Monk': {
    name: 'Monk',
    desc: 'Guerrero espiritual de puños divinos. Canaliza su energía interna en golpes devastadores.',
    role: 'DPS Híbrido / Combo',
    focus: 'STR y AGI para combos rápidos y Asura Strike',
    color: 'from-stone-600 to-stone-800 shadow-stone-950/40',
    icon: '👊'
  },
  'Blacksmith': {
    name: 'Blacksmith',
    desc: 'Forjador de armas legendarias. Mejora el equipo de sus aliados y golpea con martillos pesados.',
    role: 'Buffs de Arma / Burst DPS',
    focus: 'STR y DEX para forja y daño con Mammonite',
    color: 'from-zinc-600 to-zinc-900 shadow-zinc-950/40',
    icon: '🔨'
  },
  'Alchemist': {
    name: 'Alchemist',
    desc: 'Heredero de los secretos químicos. Crea pociones y homúnculos para el combate.',
    role: 'Científico de Combate',
    focus: 'INT y DEX para brebajes lanzables',
    color: 'from-lime-600 to-green-800 shadow-lime-950/40',
    icon: '🧪'
  },
  'Assassin': {
    name: 'Assassin',
    desc: 'Ejecutor silencioso que porta dual-wield o katar. Desaparece en la niebla.',
    role: 'Melee DPS / Sigilo',
    focus: 'AGI y STR para velocidad y daño crítico',
    color: 'from-purple-800 to-black shadow-purple-950/40',
    icon: '👣'
  },
  'Lord Knight': {
    name: 'Lord Knight',
    desc: 'Guerrero blindado de vanguardia con salud masiva. Domina el campo defendiendo con acero robusto.',
    role: 'Tanque / Físico Pesado',
    focus: 'Alta VIT, Daño físico masivo con Bash',
    color: 'from-rose-500 to-red-700 shadow-rose-950/40',
    icon: '👑'
  },
  'Paladin': {
    name: 'Paladin',
    desc: 'El defensor sagrado definitivo. Escudo inquebrantable de la fe.',
    role: 'Tanque Supremo',
    focus: 'VIT máxima para Sacrifice y Shield Boomerang',
    color: 'from-yellow-500 to-amber-700 shadow-yellow-950/40',
    icon: '🛡️✨'
  },
  'High Wizard': {
    name: 'High Wizard',
    desc: 'El archimago definitivo. Canaliza el poder elemental puro para devastar el campo de batalla.',
    role: 'Burst Mágico Masivo',
    focus: 'Máxima INT y DEX para Chain Lightning',
    color: 'from-purple-500 to-indigo-900 shadow-indigo-950/40',
    icon: '☄️'
  },
  'Professor': {
    name: 'Professor',
    desc: 'Académico soberano de lo arcano. Su conocimiento altera el flujo de la magia.',
    role: 'Control total de SP',
    focus: 'INT y DEX para Double Bolt e Heaven Drive',
    color: 'from-amber-500 to-orange-900 shadow-amber-950/40',
    icon: '🎓'
  },
  'Sniper': {
    name: 'Sniper',
    desc: 'Arquero prodigio de puntería milimétrica. Controla la distancia con flechas dobles y caza junto a su halcón fiel.',
    role: 'Rango / DPS Continuo',
    focus: 'Alta DEX y AGI, golpes de halcón a distancia',
    color: 'from-sky-400 to-cyan-700 shadow-cyan-950/40',
    icon: '🦅'
  },
  'Clown': {
    name: 'Clown',
    desc: 'El trovador de leyendas. Sus cantos resuenan en el alma de los guerreros.',
    role: 'Soporte Maestro',
    focus: 'DEX alta para Arrown Vulcan XL',
    color: 'from-emerald-500 to-teal-700 shadow-emerald-950/40',
    icon: '🤡'
  },
  'Gypsy': {
    name: 'Gypsy',
    desc: 'Hechicera de la danza. Sus movimientos son tan bellos como letales.',
    role: 'DPS Evasivo Supremo',
    focus: 'AGI máxima para Arrow Vulcan XL',
    color: 'from-rose-500 to-pink-700 shadow-rose-950/40',
    icon: '💃🌟'
  },
  'High Priest': {
    name: 'High Priest',
    desc: 'Consagrado devoto de la luz celestial. Sana heridas, otorga bendiciones y conjura luz divina.',
    role: 'Soporte / Sagrado',
    focus: 'Alta INT, curas automáticas y ráfagas de luz',
    color: 'from-emerald-400 to-teal-700 shadow-emerald-950/40',
    icon: '☀️'
  },
  'Champion': {
    name: 'Champion',
    desc: 'Avatar del espíritu guerrero. Sus puños rompen el destino mismo.',
    role: 'Burst DPS Definitivo',
    focus: 'STR pura para Asura Strike High',
    color: 'from-stone-500 to-stone-700 shadow-stone-950/40',
    icon: '☄️👊'
  },
  'Whitesmith': {
    name: 'Whitesmith',
    desc: 'Maestro artesano del acero. Capaz de fundir armas y machacar enemigos con una fuerza bruta inaudita.',
    role: 'Cuerpo a Cuerpo / Crafter',
    focus: 'Máxima STR para Cart Termination',
    color: 'from-orange-400 to-zinc-800 shadow-orange-950/40',
    icon: '⚒️'
  },
  'Creator': {
    name: 'Creator',
    desc: 'El alquimista supremo. Crea vida y destruye ejércitos con demostraciones ácidas.',
    role: 'DPS Químico / Support',
    focus: 'INT y STR para Acid Demonstration',
    color: 'from-lime-500 to-green-700 shadow-lime-950/40',
    icon: '🧬'
  },
  'Assassin Cross': {
    name: 'Assassin Cross',
    desc: 'Asesino letal de las sombras. Evade asaltos a la velocidad del trueno y despedaza con Katar fulmíneo.',
    role: 'Evasor / DPS Crítico',
    focus: 'Alta AGI y LUK, Sonic Blow devastador',
    color: 'from-fuchsia-500 to-purple-800 shadow-purple-950/40',
    icon: '🦂'
  },
  'Stalker': {
    name: 'Stalker',
    desc: 'La sombra inalcanzable. Copia habilidades ajenas y sabotea sin ser visto.',
    role: 'Sigilo / Sabotaje',
    focus: 'AGI y DEX para Chase Walk y Back Stab High',
    color: 'from-slate-600 to-stone-900 shadow-slate-950/40',
    icon: '👤'
  }
};

const statTooltips: Record<string, { title: string; desc: string }> = {
  str: { title: 'Fuerza (STR)', desc: 'Brinda +ATK cuerpo a cuerpo y aumenta la potencia de golpes físicos.' },
  agi: { title: 'Agilidad (AGI)', desc: 'Eleva el índice de esquiva (+FLEE) y velocidad de asalto (+ASPD).' },
  vit: { title: 'Vitalidad (VIT)', desc: 'Incrementa sustancialmente tu HP máximo (+Max HP) y mitigación de golpes.' },
  int: { title: 'Inteligencia (INT)', desc: 'Aumenta el poder de curación y ráfagas de poder sagrado (+Max SP).' },
  dex: { title: 'Destreza (DEX)', desc: 'Perfecciona tu precisión (+HIT) para asestar ataques infalibles.' },
  luk: { title: 'Suerte (LUK)', desc: 'Multiplica la probabilidad de golpes críticos masivos devastadores.' }
};

interface RagnarokMenuProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'status' | 'inventory' | 'skills';
}

export function RagnarokMenu({ isOpen, onClose, initialTab = 'status' }: RagnarokMenuProps) {
  const store = useGameStore();

  const [activeTab, setActiveTab] = useState<'status' | 'inventory' | 'skills'>(initialTab);
  const [backpackTab, setBackpackTab] = useState<'all' | 'equipment' | 'consumable' | 'material'>('all');
  const [selectedItem, setSelectedItem] = useState<(InventoryItem & { isEquipped?: boolean; equippedSlot?: EquipmentSlot }) | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);

  // Status Point Allocation modifier: '1' | '5' | '10' | 'MAX'
  const [allocModifier, setAllocModifier] = useState<'1' | '5' | '10' | 'MAX'>('1');

  if (!isOpen) return null;

  // Retrieve default stats for job to support resets
  const defaultStatsForJob = (job: JobClass, stat: string): number => {
    const defaults: Record<JobClass, Record<string, number>> = {
      'Novice': { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 },
      'Swordsman': { str: 18, agi: 12, vit: 18, int: 5, dex: 12, luk: 6 },
      'Acolyte': { str: 8, agi: 8, vit: 12, int: 20, dex: 12, luk: 8 },
      'Thief': { str: 14, agi: 20, vit: 8, int: 5, dex: 14, luk: 10 },
      'Archer': { str: 8, agi: 18, vit: 8, int: 8, dex: 20, luk: 8 },
      'Mage': { str: 5, agi: 8, vit: 10, int: 22, dex: 14, luk: 6 },
      'Merchant': { str: 15, agi: 10, vit: 15, int: 5, dex: 10, luk: 8 },
      'Knight': { str: 45, agi: 35, vit: 50, int: 15, dex: 35, luk: 20 },
      'Crusader': { str: 40, agi: 30, vit: 65, int: 35, dex: 30, luk: 25 },
      'Wizard': { str: 10, agi: 25, vit: 30, int: 55, dex: 45, luk: 20 },
      'Sage': { str: 20, agi: 35, vit: 35, int: 45, dex: 50, luk: 20 },
      'Hunter': { str: 20, agi: 45, vit: 30, int: 25, dex: 55, luk: 35 },
      'Bard': { str: 25, agi: 40, vit: 35, int: 40, dex: 50, luk: 20 },
      'Dancer': { str: 20, agi: 50, vit: 30, int: 45, dex: 40, luk: 25 },
      'Priest': { str: 15, agi: 25, vit: 35, int: 50, dex: 40, luk: 25 },
      'Monk': { str: 55, agi: 45, vit: 40, int: 25, dex: 35, luk: 20 },
      'Blacksmith': { str: 55, agi: 30, vit: 45, int: 10, dex: 40, luk: 25 },
      'Alchemist': { str: 40, agi: 25, vit: 45, int: 40, dex: 40, luk: 30 },
      'Assassin': { str: 50, agi: 55, vit: 30, int: 10, dex: 35, luk: 30 },
      'Rogue': { str: 45, agi: 50, vit: 35, int: 15, dex: 50, luk: 25 },
      'Lord Knight': { str: 85, agi: 65, vit: 80, int: 20, dex: 50, luk: 30 },
      'Paladin': { str: 75, agi: 55, vit: 99, int: 45, dex: 45, luk: 35 },
      'High Wizard': { str: 15, agi: 35, vit: 45, int: 99, dex: 75, luk: 25 },
      'Professor': { str: 35, agi: 55, vit: 55, int: 90, dex: 85, luk: 30 },
      'Sniper': { str: 30, agi: 90, vit: 40, int: 35, dex: 99, luk: 40 },
      'Clown': { str: 45, agi: 80, vit: 60, int: 70, dex: 90, luk: 30 },
      'Gypsy': { str: 35, agi: 95, vit: 50, int: 80, dex: 80, luk: 35 },
      'High Priest': { str: 20, agi: 40, vit: 75, int: 99, dex: 70, luk: 15 },
      'Champion': { str: 99, agi: 85, vit: 65, int: 45, dex: 60, luk: 25 },
      'Whitesmith': { str: 99, agi: 60, vit: 70, int: 20, dex: 70, luk: 40 },
      'Creator': { str: 80, agi: 50, vit: 80, int: 80, dex: 70, luk: 40 },
      'Assassin Cross': { str: 90, agi: 95, vit: 45, int: 15, dex: 45, luk: 40 },
      'Stalker': { str: 75, agi: 99, vit: 55, int: 35, dex: 85, luk: 35 },
    };
    return defaults[job]?.[stat] || 5;
  };

  // Status limits and availability calculations
  const statsList = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
  const totalAllocated = statsList.reduce(
    (acc, s) => acc + (store.baseStats[s] - defaultStatsForJob(store.jobClass, s)), 
    0
  );
  // Status points calculation (starts with 30 status points at level 1, plus 3 per subsequent level)
  const availablePoints = Math.max(0, 30 + (store.stats.level - 1) * 3 - totalAllocated);

  const getRarityStyles = (itemId: string) => {
    const details = itemDetailsDb[itemId] || { rarity: 'common' };
    switch (details.rarity) {
      case 'epic':
        return {
          border: 'border-amber-500 bg-amber-950/40 text-amber-100 ring-1 ring-amber-500/30',
          badge: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
          color: 'text-amber-400'
        };
      case 'rare':
        return {
          border: 'border-indigo-500 bg-indigo-950/40 text-indigo-100 ring-1 ring-indigo-500/30',
          badge: 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50',
          color: 'text-indigo-400'
        };
      default:
        return {
          border: 'border-slate-800 bg-slate-900/60 text-slate-300',
          badge: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
          color: 'text-slate-500'
        };
    }
  };

  // Core fast tactile assign logic
  const handleTactileIncrease = (statName: 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk') => {
    if (availablePoints <= 0) return;

    let pointsToSubmit = 1;
    if (allocModifier === '5') pointsToSubmit = 5;
    if (allocModifier === '10') pointsToSubmit = 10;
    if (allocModifier === 'MAX') pointsToSubmit = availablePoints;

    const actualPoints = Math.min(pointsToSubmit, availablePoints);
    if (actualPoints <= 0) return;

    const currentBaseVal = store.baseStats[statName];
    const newBaseStats = { ...store.baseStats, [statName]: currentBaseVal + actualPoints };

    // Update base stats and recalculate derivative results
    useGameStore.setState({ baseStats: newBaseStats });
    store.recalculateStats();

    // Trigger state adjustments
    if (statName === 'vit') {
      useGameStore.setState({ currentHp: store.currentHp + (actualPoints * 250) });
    }
    if (statName === 'int') {
      useGameStore.setState({ currentSp: store.currentSp + (actualPoints * 15) });
    }

    store.addCombatLog(`[Tactil] Asignado +${actualPoints} ${statName.toUpperCase()}.`, 'system');
  };

  // Smart Pre-designed Allocator (Ragnarok Classic builds recommendation)
  const handleSmartAutoAssign = () => {
    if (availablePoints <= 0) return;

    // Define proportions according to your current Job class
    let distribution: Record<string, number> = {};
    if (store.jobClass === 'Novice') {
      distribution = { str: 0.2, agi: 0.2, vit: 0.2, dex: 0.2, int: 0.1, luk: 0.1 };
    } else if (store.jobClass === 'Swordsman' || store.jobClass === 'Lord Knight') {
      distribution = { vit: 0.6, str: 0.4 };
    } else if (store.jobClass === 'Acolyte' || store.jobClass === 'High Priest') {
      distribution = { int: 0.7, dex: 0.3 };
    } else if (store.jobClass === 'Thief' || store.jobClass === 'Assassin Cross') {
      distribution = { agi: 0.6, luk: 0.4 };
    } else if (store.jobClass === 'Archer' || store.jobClass === 'Sniper') {
      distribution = { dex: 0.6, agi: 0.4 };
    }

    const nextBaseStats = { ...store.baseStats };
    let pointsSpent = 0;

    Object.entries(distribution).forEach(([statKey, ratio]) => {
      const shares = Math.floor(availablePoints * ratio);
      if (shares > 0) {
        nextBaseStats[statKey as keyof typeof nextBaseStats] += shares;
        pointsSpent += shares;

        if (statKey === 'vit') {
          useGameStore.setState({ currentHp: store.currentHp + (shares * 250) });
        }
        if (statKey === 'int') {
          useGameStore.setState({ currentSp: store.currentSp + (shares * 15) });
        }
      }
    });

    // Handle any remainders due to flooring rounding issues
    const remaining = availablePoints - pointsSpent;
    if (remaining > 0) {
      const primaryStat = Object.keys(distribution)[0];
      if (primaryStat) {
        nextBaseStats[primaryStat as keyof typeof nextBaseStats] += remaining;
        
        if (primaryStat === 'vit') {
          useGameStore.setState({ currentHp: store.currentHp + (remaining * 250) });
        }
        if (primaryStat === 'int') {
          useGameStore.setState({ currentSp: store.currentSp + (remaining * 15) });
        }
      }
    }

    useGameStore.setState({ baseStats: nextBaseStats });
    store.recalculateStats();
    store.addCombatLog(`[Recomendador Inteligente] Distribuidos automáticamente ${availablePoints} puntos de atributos.`, 'system');
  };

  const handleResetPoints = () => {
    const defaultsForJob: Record<JobClass, any> = {
      'Novice': {
        level: 1, jobLevel: 1, str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5,
        atk: 10, def: 5, hit: 10, flee: 10, aspd: 110, maxHp: 160, maxSp: 30
      },
      'Swordsman': {
        level: 10, jobLevel: 1, str: 18, agi: 12, vit: 18, int: 5, dex: 12, luk: 6,
        atk: 42, def: 24, hit: 24, flee: 18, aspd: 125, maxHp: 850, maxSp: 80
      },
      'Acolyte': {
        level: 10, jobLevel: 1, str: 8, agi: 8, vit: 12, int: 20, dex: 12, luk: 8,
        atk: 22, def: 18, hit: 22, flee: 18, aspd: 120, maxHp: 650, maxSp: 180
      },
      'Thief': {
        level: 10, jobLevel: 1, str: 14, agi: 20, vit: 8, int: 5, dex: 14, luk: 10,
        atk: 32, def: 12, hit: 26, flee: 32, aspd: 135, maxHp: 580, maxSp: 100
      },
      'Archer': {
        level: 10, jobLevel: 1, str: 8, agi: 18, vit: 8, int: 8, dex: 20, luk: 8,
        atk: 28, def: 10, hit: 32, flee: 26, aspd: 130, maxHp: 540, maxSp: 120
      },
      'Mage': {
        level: 10, jobLevel: 1, str: 5, agi: 8, vit: 10, int: 22, dex: 14, luk: 6,
        atk: 18, def: 12, hit: 20, flee: 16, aspd: 115, maxHp: 520, maxSp: 220
      },
      'Merchant': {
        level: 10, jobLevel: 1, str: 15, agi: 10, vit: 15, int: 5, dex: 10, luk: 8,
        atk: 35, def: 20, hit: 22, flee: 15, aspd: 120, maxHp: 750, maxSp: 90
      },
      'Knight': {
        level: 40, jobLevel: 1, str: 45, agi: 35, vit: 50, int: 15, dex: 35, luk: 20,
        atk: 120, def: 85, hit: 90, flee: 85, aspd: 142, maxHp: 4200, maxSp: 180
      },
      'Crusader': {
        level: 40, jobLevel: 1, str: 40, agi: 30, vit: 65, int: 35, dex: 30, luk: 25,
        atk: 110, def: 120, hit: 85, flee: 70, aspd: 135, maxHp: 4800, maxSp: 320
      },
      'Wizard': {
        level: 40, jobLevel: 1, str: 10, agi: 25, vit: 30, int: 55, dex: 45, luk: 20,
        atk: 60, def: 55, hit: 85, flee: 75, aspd: 132, maxHp: 2800, maxSp: 850
      },
      'Sage': {
        level: 40, jobLevel: 1, str: 20, agi: 35, vit: 35, int: 45, dex: 50, luk: 20,
        atk: 90, def: 65, hit: 105, flee: 90, aspd: 140, maxHp: 3100, maxSp: 620
      },
      'Hunter': {
        level: 40, jobLevel: 1, str: 20, agi: 45, vit: 30, int: 25, dex: 55, luk: 35,
        atk: 110, def: 65, hit: 110, flee: 115, aspd: 148, maxHp: 3200, maxSp: 350
      },
      'Bard': {
        level: 40, jobLevel: 1, str: 25, agi: 40, vit: 35, int: 40, dex: 50, luk: 20,
        atk: 95, def: 60, hit: 105, flee: 100, aspd: 145, maxHp: 3000, maxSp: 480
      },
      'Dancer': {
        level: 40, jobLevel: 1, str: 20, agi: 50, vit: 30, int: 45, dex: 40, luk: 25,
        atk: 88, def: 55, hit: 95, flee: 120, aspd: 152, maxHp: 2800, maxSp: 520
      },
      'Priest': {
        level: 40, jobLevel: 1, str: 15, agi: 25, vit: 35, int: 50, dex: 40, luk: 25,
        atk: 80, def: 75, hit: 100, flee: 95, aspd: 135, maxHp: 3500, maxSp: 750
      },
      'Monk': {
        level: 40, jobLevel: 1, str: 55, agi: 45, vit: 40, int: 25, dex: 35, luk: 20,
        atk: 150, def: 65, hit: 95, flee: 110, aspd: 150, maxHp: 3900, maxSp: 420
      },
      'Blacksmith': {
        level: 40, jobLevel: 1, str: 55, agi: 30, vit: 45, int: 10, dex: 40, luk: 25,
        atk: 180, def: 110, hit: 105, flee: 80, aspd: 140, maxHp: 4500, maxSp: 250
      },
      'Alchemist': {
        level: 40, jobLevel: 1, str: 40, agi: 25, vit: 45, int: 40, dex: 40, luk: 30,
        atk: 140, def: 90, hit: 100, flee: 75, aspd: 132, maxHp: 4100, maxSp: 450
      },
      'Assassin': {
        level: 40, jobLevel: 1, str: 50, agi: 55, vit: 30, int: 10, dex: 35, luk: 30,
        atk: 160, def: 70, hit: 115, flee: 140, aspd: 155, maxHp: 3800, maxSp: 280
      },
      'Rogue': {
        level: 40, jobLevel: 1, str: 45, agi: 50, vit: 35, int: 15, dex: 50, luk: 25,
        atk: 145, def: 80, hit: 120, flee: 130, aspd: 150, maxHp: 3600, maxSp: 310
      },
      'Lord Knight': {
        level: 99, jobLevel: 70, str: 85, agi: 65, vit: 80, int: 20, dex: 50, luk: 30,
        atk: 340, def: 180, hit: 240, flee: 195, aspd: 168, maxHp: 18400, maxSp: 420
      },
      'Paladin': {
        level: 99, jobLevel: 70, str: 75, agi: 55, vit: 99, int: 45, dex: 45, luk: 35,
        atk: 290, def: 240, hit: 220, flee: 170, aspd: 162, maxHp: 21500, maxSp: 680
      },
      'High Wizard': {
        level: 99, jobLevel: 70, str: 15, agi: 35, vit: 45, int: 99, dex: 75, luk: 25,
        atk: 180, def: 120, hit: 220, flee: 185, aspd: 152, maxHp: 9800, maxSp: 2450
      },
      'Professor': {
        level: 99, jobLevel: 70, str: 35, agi: 55, vit: 55, int: 90, dex: 85, luk: 30,
        atk: 240, def: 140, hit: 260, flee: 210, aspd: 165, maxHp: 10500, maxSp: 1850
      },
      'Sniper': {
        level: 99, jobLevel: 70, str: 30, agi: 90, vit: 40, int: 35, dex: 99, luk: 40,
        atk: 360, def: 110, hit: 299, flee: 260, aspd: 178, maxHp: 12500, maxSp: 720
      },
      'Clown': {
        level: 99, jobLevel: 70, str: 45, agi: 80, vit: 60, int: 70, dex: 90, luk: 30,
        atk: 280, def: 140, hit: 270, flee: 240, aspd: 175, maxHp: 13200, maxSp: 1100
      },
      'Gypsy': {
        level: 99, jobLevel: 70, str: 35, agi: 95, vit: 50, int: 80, dex: 80, luk: 35,
        atk: 240, def: 130, hit: 250, flee: 280, aspd: 182, maxHp: 12200, maxSp: 1400
      },
      'High Priest': {
        level: 99, jobLevel: 70, str: 20, agi: 40, vit: 75, int: 99, dex: 70, luk: 15,
        atk: 145, def: 150, hit: 210, flee: 175, aspd: 154, maxHp: 11200, maxSp: 1980
      },
      'Champion': {
        level: 99, jobLevel: 70, str: 99, agi: 85, vit: 65, int: 45, dex: 60, luk: 25,
        atk: 450, def: 130, hit: 240, flee: 250, aspd: 180, maxHp: 16500, maxSp: 850
      },
      'Whitesmith': {
        level: 99, jobLevel: 70, str: 99, agi: 60, vit: 70, int: 20, dex: 70, luk: 40,
        atk: 420, def: 190, hit: 250, flee: 210, aspd: 170, maxHp: 21000, maxSp: 650
      },
      'Creator': {
        level: 99, jobLevel: 70, str: 80, agi: 50, vit: 80, int: 80, dex: 70, luk: 40,
        atk: 360, def: 170, hit: 240, flee: 180, aspd: 160, maxHp: 18500, maxSp: 1200
      },
      'Assassin Cross': {
        level: 99, jobLevel: 70, str: 90, agi: 95, vit: 45, int: 15, dex: 45, luk: 40,
        atk: 395, def: 95, hit: 235, flee: 285, aspd: 182, maxHp: 14200, maxSp: 510
      },
      'Stalker': {
        level: 99, jobLevel: 70, str: 75, agi: 99, vit: 55, int: 35, dex: 85, luk: 35,
        atk: 310, def: 140, hit: 280, flee: 290, aspd: 180, maxHp: 15400, maxSp: 680
      },
    };
    
    useGameStore.setState({ baseStats: defaultsForJob[store.jobClass] });
    store.recalculateStats();
    store.addCombatLog('Atributos reiniciados a los valores base de tu profesión.', 'system');
  };

  const handleEquip = (item: InventoryItem) => {
    if (!item.slot) return;
    store.equipItem(item.id, item.slot);
    store.addCombatLog(`Equipado: [${item.name}] en ranura [${item.slot}].`, 'system');
    setSelectedItem(null);
  };

  const handleUnequip = (slot: EquipmentSlot, name: string) => {
    store.unequipItem(slot);
    store.addCombatLog(`Desequipado: [${name}]. Se guardó en la mochila.`, 'system');
    setSelectedItem(null);
  };

  const handleUseConsumable = (item: InventoryItem) => {
    if (item.id === 'red_potion') {
      store.drinkPotion();
      const updatedItem = store.inventory.find(i => i.id === item.id);
      if (updatedItem && updatedItem.quantity > 0) {
        setSelectedItem({ ...updatedItem, isEquipped: false });
      } else {
        setSelectedItem(null);
      }
    } else if (item.id === 'awakening_potion') {
      if (store.currentHp <= 0) {
        store.addCombatLog('No puedes usar pociones si estás derrotado.', 'system');
        return;
      }
      store.addCombatLog('¡Utilizas Awakening Potion! Velocidad de ataque aumentada (+10 ASPD).', 'heal');
      store.addBuff({
        id: 'awakening_potion_buff',
        name: 'Awakening Buff',
        durationMs: 35000,
        maxDurationMs: 35000,
        icon: '⚡',
        description: 'ASPD incrementado notablemente'
      });

      const updated = store.inventory.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      ).filter(i => i.quantity > 0);
      
      useGameStore.setState({ inventory: updated });

      const updatedItem = updated.find(i => i.id === item.id);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, isEquipped: false });
      } else {
        setSelectedItem(null);
      }
    }
  };

  const handleDiscard = (item: InventoryItem) => {
    const updated = store.inventory.map(i => 
      i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
    ).filter(i => i.quantity > 0);
    
    if (item.id === 'red_potion') {
      store.setPotCount(Math.max(0, store.potCount - 1));
    }

    useGameStore.setState({ inventory: updated });
    store.addCombatLog(`Descartado: 1x [${item.name}].`, 'system');

    const updatedItem = updated.find(i => i.id === item.id);
    if (updatedItem) {
      setSelectedItem({ ...updatedItem, isEquipped: false });
    } else {
      setSelectedItem(null);
    }
  };

  const baseExpPercent = (store.playerBaseExp / store.playerBaseMaxExp) * 100;
  const jobExpPercent = (store.playerJobExp / store.playerJobMaxExp) * 100;

  const filteredInventory = store.inventory.filter(item => {
    if (backpackTab === 'all') return true;
    return item.type === backpackTab;
  });

  const jobColors: Record<JobClass, string> = {
    'Novice': 'from-slate-600 to-slate-800 border-slate-500/40 shadow-slate-950/20',
    'Swordsman': 'from-orange-650 to-red-800 border-orange-500/40 shadow-orange-950/20',
    'Mage': 'from-indigo-600 to-purple-800 border-indigo-500/40 shadow-indigo-950/20',
    'Acolyte': 'from-teal-650 to-emerald-800 border-teal-500/40 shadow-teal-950/20',
    'Thief': 'from-purple-650 to-purple-850 border-purple-500/40 shadow-purple-950/20',
    'Archer': 'from-cyan-650 to-cyan-800 border-cyan-500/40 shadow-cyan-950/20',
    'Merchant': 'from-yellow-600 to-amber-800 border-yellow-500/40 shadow-yellow-950/20',
    'Knight': 'from-orange-700 to-red-900 border-orange-600/40 shadow-orange-950/20',
    'Crusader': 'from-yellow-600 to-orange-700 border-yellow-500/40 shadow-yellow-950/20',
    'Wizard': 'from-indigo-700 to-violet-900 border-indigo-600/40 shadow-indigo-950/20',
    'Sage': 'from-amber-600 to-orange-800 border-amber-500/40 shadow-amber-950/20',
    'Hunter': 'from-blue-600 to-teal-800 border-blue-500/40 shadow-blue-950/20',
    'Bard': 'from-emerald-600 to-teal-800 border-emerald-500/40 shadow-emerald-950/20',
    'Dancer': 'from-rose-600 to-pink-800 border-rose-500/40 shadow-rose-950/20',
    'Priest': 'from-sky-400 to-blue-600 border-sky-400/40 shadow-sky-950/20',
    'Monk': 'from-stone-600 to-stone-800 border-stone-500/40 shadow-stone-950/20',
    'Blacksmith': 'from-zinc-600 to-zinc-900 border-zinc-500/40 shadow-zinc-950/20',
    'Alchemist': 'from-lime-600 to-green-800 border-lime-500/40 shadow-lime-950/20',
    'Assassin': 'from-purple-800 to-black border-purple-700/40 shadow-purple-950/20',
    'Rogue': 'from-slate-700 to-stone-900 border-slate-600/40 shadow-slate-950/20',
    'Lord Knight': 'from-rose-650 to-red-800 border-rose-500/40 shadow-rose-950/20',
    'Paladin': 'from-yellow-500 to-amber-700 border-yellow-400/40 shadow-yellow-950/20',
    'High Wizard': 'from-purple-500 to-indigo-900 border-purple-500/40 shadow-indigo-950/20',
    'Professor': 'from-amber-600 to-orange-900 border-amber-500/40 shadow-amber-950/20',
    'Sniper': 'from-sky-650 to-cyan-800 border-cyan-500/40 shadow-cyan-950/20',
    'Clown': 'from-emerald-650 to-teal-800 border-emerald-500/40 shadow-emerald-950/20',
    'Gypsy': 'from-rose-650 to-pink-800 border-rose-500/40 shadow-rose-950/20',
    'High Priest': 'from-emerald-650 to-teal-800 border-emerald-500/40 shadow-emerald-950/20',
    'Champion': 'from-stone-600 to-stone-800 border-stone-500/40 shadow-stone-950/20',
    'Whitesmith': 'from-orange-400 to-zinc-800 border-orange-400/40 shadow-orange-950/20',
    'Creator': 'from-lime-600 to-green-800 border-lime-500/40 shadow-lime-950/20',
    'Assassin Cross': 'from-fuchsia-650 to-purple-850 border-purple-500/40 shadow-purple-950/20',
    'Stalker': 'from-slate-700 to-stone-900 border-slate-600/40 shadow-slate-950/20'
  };

  const displayTabMenu = (
    <div className="flex bg-slate-950/80 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/50 max-w-xl w-full mx-auto shadow-[0_5px_15px_-3px_rgba(0,0,0,0.5)] select-none gap-1">
      <button
        onClick={() => {
          setActiveTab('status');
          setSelectedItem(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider relative overflow-hidden group ${
          activeTab === 'status' 
            ? 'text-white' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {activeTab === 'status' && (
          <motion.div layoutId="tab-highlight" className="absolute inset-0 bg-linear-to-b from-indigo-500 to-indigo-800 rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400/50" />
        )}
        <User className="w-4 h-4 relative z-10" />
        <span className="relative z-10 drop-shadow-md">Ficha y Stats</span>
      </button>
      <button
        onClick={() => {
          setActiveTab('skills');
          setSelectedItem(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider relative overflow-hidden group ${
          activeTab === 'skills' 
            ? 'text-white' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {activeTab === 'skills' && (
          <motion.div layoutId="tab-highlight" className="absolute inset-0 bg-linear-to-b from-indigo-500 to-indigo-800 rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400/50" />
        )}
        <BookOpen className="w-4 h-4 relative z-10" />
        <span className="relative z-10 drop-shadow-md">Habilidades</span>
      </button>
      <button
        onClick={() => {
          setActiveTab('inventory');
          setSelectedItem(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider relative overflow-hidden group ${
          activeTab === 'inventory' 
            ? 'text-white' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {activeTab === 'inventory' && (
          <motion.div layoutId="tab-highlight" className="absolute inset-0 bg-linear-to-b from-indigo-500 to-indigo-800 rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400/50" />
        )}
        <ShoppingBag className="w-4 h-4 relative z-10" />
        <span className="relative z-10 drop-shadow-md">Equipo e Inv.</span>
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-lg overflow-y-auto"
        onClick={onClose}
      >
        {/* Main responsive tactile panel */}
        <div 
          className="relative max-w-4xl w-full flex flex-col gap-4 text-slate-100 font-sans pointer-events-auto h-[92vh] max-h-[850px]"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header Bar */}
          <div className="flex justify-between items-center bg-[#182335] rounded-2xl px-5 py-3 border border-slate-750/80 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center font-bold text-lg select-none">
                🧭
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest font-mono text-indigo-300">Menú del Aventurero</h2>
                <div className="flex items-center gap-2 scale-90 origin-left mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Interfaz Móvil Optimizada</span>
                </div>
              </div>
            </div>

            {/* Tap to close fully sized for fingers (48px) */}
            <button
              onClick={onClose}
              className="w-11 h-11 bg-slate-900 hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-500/20 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-90"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unified Touch Selector for Screens */}
          {displayTabMenu}

          {/* Body Content Container */}
          <div className="flex-1 bg-[#162134]/90 rounded-3xl border border-slate-750 shadow-2xl overflow-hidden flex flex-col">
            
            {/* SCREEN 1: STATUS & SMART ATTRIBUTES */}
            {activeTab === 'status' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex flex-col">
                
                {/* Character Profile Ribbon */}
                <div className={`p-4 rounded-3xl bg-linear-to-br ${jobColors[store.jobClass]} border-2 border-white/10 text-white relative shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] overflow-hidden`}>
                  
                  {/* Decorative Background Elements */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />
                  
                  {/* Floating Touch Job switcher trigger (large comfortable tap size) */}
                  <button 
                    onClick={() => setShowJobSelector(!showJobSelector)}
                    className="absolute right-4 top-4 bg-slate-950/60 hover:bg-slate-900 border border-white/20 active:scale-95 transition-all rounded-xl px-3 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-md z-10"
                  >
                    Clase: <span className="text-amber-400 drop-shadow-md">{store.jobClass}</span> <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  </button>

                  <div className="flex items-center gap-4 relative z-10 pt-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-white/5 to-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-5xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.4)] drop-shadow-lg">
                      {jobInfo[store.jobClass].icon}
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl tracking-widest uppercase text-shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">Rookie Hero</h3>
                      <p className="text-[11px] text-white/90 font-mono font-black border border-white/20 bg-black/40 shadow-inner py-0.5 px-2 rounded-md inline-block uppercase tracking-wider backdrop-blur-md">
                        BASE <span className="text-amber-300 mx-1">{store.stats.level}</span> | JOB <span className="text-amber-300 ml-1">{store.stats.jobLevel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Exp Bars */}
                  <div className="mt-5 space-y-2 relative z-10 border-t border-white/20 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-display font-black uppercase tracking-wider mb-1.5 text-shadow-md">
                          <span className="text-cyan-300">Base Exp: {Math.round(baseExpPercent)}%</span>
                          <span>{store.playerBaseExp.toLocaleString()} / {store.playerBaseMaxExp.toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                          <div className="h-full bg-linear-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)] relative">
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/25 rounded-t-full" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-display font-black uppercase tracking-wider mb-1.5 text-shadow-md">
                          <span className="text-emerald-300">Job Exp: {Math.round(jobExpPercent)}%</span>
                          <span>{store.playerJobExp.toLocaleString()} / {store.playerJobMaxExp.toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                          <div className="h-full bg-linear-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] relative">
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/25 rounded-t-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Selector overlay */}
                <AnimatePresence>
                  {showJobSelector && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-slate-900 border border-slate-750 rounded-2xl p-4 space-y-3 shadow-2xl"
                    >
                      <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">Cambiar Profesión Rúnica</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Only show valid next jobs or inform about requirements */}
                        {JOB_TREE[store.jobClass].nextJobs.length > 0 ? (
                          JOB_TREE[store.jobClass].nextJobs.map((k) => {
                            const j = jobInfo[k as JobClass];
                            const req = JOB_TREE[store.jobClass].requirement;
                            const meetsReq = store.stats.jobLevel >= req.jobLevel && (!req.baseLevel || store.stats.level >= req.baseLevel);
                            
                            return (
                              <button
                                key={k}
                                onClick={() => {
                                  if (!meetsReq) {
                                    store.addCombatLog(`❌ Aún no cumples los requisitos para ser ${k}.`, 'system');
                                    return;
                                  }
                                  store.setJobClass(k as JobClass);
                                  setShowJobSelector(false);
                                }}
                                className={`p-3.5 text-left border rounded-xl transition-all text-xs flex items-center justify-between active:scale-[0.98] ${
                                  meetsReq
                                    ? 'bg-slate-950/30 border-slate-700 text-slate-200 hover:border-indigo-500 hover:bg-indigo-950/20'
                                    : 'bg-slate-900/50 border-slate-850 text-slate-600 grayscale'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{j.icon}</span>
                                  <div>
                                    <span className="font-extrabold block">{j.name}</span>
                                    <span className="text-[10px] block font-normal opacity-70">
                                      {meetsReq ? j.role : `Requi: Job Lv ${req.jobLevel}`}
                                    </span>
                                  </div>
                                </div>
                                {!meetsReq && <ZapOff className="w-4 h-4 text-slate-700" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-6 text-center space-y-3">
                            <Crown className="w-8 h-8 text-amber-500 mx-auto" />
                            <div>
                                <p className="text-sm font-black text-slate-200 uppercase">Has alcanzado el límite de esta rama</p>
                                <p className="text-xs text-slate-400">¡Busca el poder del renacimiento al llegar a Nivel 99!</p>
                            </div>
                            
                            {/* Rebirth Button - Only visible if 99/50 */}
                            {store.stats.level >= 99 && store.stats.jobLevel >= 50 && (
                                <button
                                    onClick={() => {
                                        store.setJobClass('Novice');
                                        setShowJobSelector(false);
                                    }}
                                    className="px-6 py-3 bg-linear-to-r from-amber-500 to-rose-600 rounded-xl text-white font-black text-xs uppercase shadow-lg shadow-amber-900/40 animate-pulse active:scale-95 transition-all"
                                >
                                    ✨ Renacer / Transcender ✨
                                </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Left/Right Tactile split for Stats */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Attributes assignment (+1, +5, +10, Max) */}
                  <div className="col-span-1 md:col-span-7 space-y-4">
                    
                    {/* Allocation modifiers bar */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                      <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <Sliders className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                          <span className="text-sm font-black uppercase text-indigo-300 tracking-widest drop-shadow-md">Asignador</span>
                        </div>
                        {availablePoints > 0 ? (
                          <span className="text-[12px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-black block mx-auto sm:mx-0 w-fit animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                            {availablePoints} PUNTOS DISPONIBLES
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">Agotado</span>
                        )}
                      </div>

                      <div className="flex gap-2 bg-slate-950/80 border border-slate-700/50 p-1.5 rounded-xl w-full sm:w-auto shrink-0 justify-around shadow-inner relative z-10">
                        {(['1', '5', '10', 'MAX'] as const).map((mod) => (
                          <button
                            key={mod}
                            onClick={() => setAllocModifier(mod)}
                            className={`py-2 px-3 sm:px-4 text-[13px] font-black rounded-lg transition-all border relative overflow-hidden group ${
                              allocModifier === mod 
                                ? 'bg-indigo-600 border-indigo-400 text-white min-w-[48px] shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                            }`}
                          >
                            {allocModifier === mod && <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-lg pointer-events-none" />}
                            <span className="relative z-10">{mod === 'MAX' ? 'MAX' : `+${mod}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attributes touch slots list */}
                    <div className="space-y-3">
                      {statsList.map((stat) => {
                        const baseVal = store.baseStats[stat];
                        const totalVal = store.stats[stat];
                        const bonus = totalVal - baseVal;
                        const spec = statTooltips[stat];

                        return (
                          <div 
                            key={stat} 
                            className="bg-slate-950/40 backdrop-blur-sm border-y border-x-[3px] border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-4 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all shadow-md group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                            <div className="min-w-0 flex-1 relative z-10">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-display font-black text-[15px] text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{stat}</span>
                                <span className="text-[10px] bg-slate-800/80 border border-slate-700 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md truncate uppercase tracking-wider">
                                  {spec.title}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block leading-tight font-medium truncate">{spec.desc}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 relative z-10">
                              <div className="p-2.5 px-4 bg-slate-950/80 rounded-xl font-display text-center border-y border-slate-800 border-x-2 border-indigo-900/50 min-w-[70px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]">
                                <span className="text-[17px] font-black text-white">{baseVal}</span>
                                {bonus > 0 && <span className="text-cyan-400 text-[13px] ml-1 font-black drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">+{bonus}</span>}
                              </div>
                              
                              {/* Large 50px touch target button */}
                              <button
                                onClick={() => handleTactileIncrease(stat)}
                                disabled={availablePoints <= 0}
                                className={`w-[50px] h-[50px] rounded-[14px] flex items-center justify-center transition-all font-display font-black text-2xl relative overflow-hidden active:scale-95 border-2 ${
                                  availablePoints > 0 
                                    ? 'bg-linear-to-b from-indigo-500 to-indigo-700 text-white shadow-[0_5px_15px_rgba(79,70,229,0.5)] border-indigo-400 hover:brightness-110 cursor-pointer pointer-events-auto' 
                                    : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed pointer-events-none'
                                }`}
                                title={`Asignar ${allocModifier} en ${stat.toUpperCase()}`}
                              >
                                {availablePoints > 0 && <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-[12px] pointer-events-none" />}
                                <span className="relative z-10 drop-shadow-md">+</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Right Column: Derivative Stats & Fast Allocation Actions */}
                  <div className="col-span-1 md:col-span-5 space-y-4">
                    
                    {/* Auto preset assignment & reset actions */}
                    <div className="bg-slate-900/60 backdrop-blur-md border-[2px] border-slate-800 rounded-2xl p-4 space-y-4 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                        <span className="text-[13px] font-black uppercase text-emerald-300 tracking-widest drop-shadow-md">Acciones Rápidas</span>
                      </div>

                      {availablePoints > 0 ? (
                        <button
                          onClick={handleSmartAutoAssign}
                          className="w-full py-4 px-4 bg-linear-to-b from-emerald-500 to-emerald-700 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(16,185,129,0.4)] border-2 border-emerald-400/80 relative overflow-hidden"
                        >
                          <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-xl" />
                          <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse relative z-10" />
                          <span className="relative z-10 drop-shadow-md text-shadow-sm">Distribución Sugerida</span>
                        </button>
                      ) : (
                        <div className="p-3 text-[11px] text-slate-500 bg-slate-950/50 border border-slate-800/50 rounded-xl text-center font-bold uppercase tracking-wider shadow-inner">
                          Apruébado para el Rol
                        </div>
                      )}

                      <button
                        onClick={handleResetPoints}
                        className="w-full py-3 bg-slate-950 hover:bg-slate-900 active:scale-[0.98] transition-all text-slate-400 hover:text-slate-200 text-[11px] font-black rounded-xl flex items-center justify-center gap-2 border border-slate-800 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] tracking-wider"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        RESETEAR BUILD (GRATIS)
                      </button>
                    </div>

                    {/* Derivative Stats Displays */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 space-y-3 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                      <span className="text-[11px] font-black uppercase text-indigo-300 tracking-wider block drop-shadow-md">Propiedades de Combate</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: '⚔️ ATK Físico', val: store.stats.atk, desc: 'Daño bruto propinado' },
                          { label: '🛡️ DEF Física', val: store.stats.def, desc: 'Daño absorbido' },
                          { label: '🎯 HIT Puntería', val: store.stats.hit, desc: 'Porcentaje de acierto' },
                          { label: '💨 FLEE Evasión', val: store.stats.flee, desc: 'Evasión de golpes' },
                          { label: '⚡ ASPD Ataque', val: store.stats.aspd, desc: 'Golpes por segundo' },
                        ].map((statDef, i) => (
                          <div key={i} className="bg-slate-950/80 border border-slate-800 border-x-2 border-indigo-900/30 p-3 rounded-xl shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-tight">{statDef.label}</span>
                            <span className="text-base font-display font-black text-white block mt-0.5 tracking-wider">{statDef.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* SCREEN 3: SKILLS AND LEVELING UP */}
            {activeTab === 'skills' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex flex-col">
                
                {/* Skill Points Status Bar */}
                <div className="bg-[#101b2a] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-inner">
                  <div>
                    <h3 className="text-sm font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                      📖 Libro de Habilidades ({store.jobClass})
                    </h3>
                    {store.skillPoints > 0 ? (
                      <span className="text-xs text-amber-300 font-extrabold animate-pulse block mt-0.5">
                        ✨ ¡Tienes {store.skillPoints} Puntos de Habilidad listos para asignar!
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-405 block mt-0.5">
                        Gana Niveles de Trabajo (Job Lv) para conseguir más puntos de habilidad.
                      </span>
                    )}
                  </div>
                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-2.5 px-5 rounded-xl text-center shrink-0 min-w-[124px]">
                    <span className="text-[9px] text-indigo-300 block font-black uppercase tracking-wider">Puntos Libres</span>
                    <span className="text-xl font-mono font-black text-amber-300">{store.skillPoints}</span>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {store.skills.map((skill) => {
                    const isMax = skill.level >= skill.maxLevel;
                    const canLevelUp = store.skillPoints > 0 && !isMax;

                    return (
                      <div 
                        key={skill.id}
                        className={`bg-[#121c2e40] border p-4 rounded-2xl flex flex-col justify-between gap-4 hover:border-slate-700/60 transition-all ${
                          skill.level > 0 ? 'border-indigo-950/50 bg-slate-900/10' : 'border-slate-850 opacity-50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-white shadow-md shadow-slate-950/40 border border-white/5" 
                                style={{ backgroundColor: skill.color }}
                              >
                                {skill.key}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-200">{skill.name}</h4>
                                <span className="text-[9px] text-slate-450 block">Acceso Rápido</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold font-mono p-1 px-2.5 rounded-full ${
                              isMax ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              Lv.{skill.level}/{skill.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-350 leading-relaxed min-h-[44px]">{skill.desc}</p>
                        </div>

                        {/* Lock / Unlock controls */}
                        {skill.level === 0 && skill.id === 'play_dead' ? (
                          <div className="p-2.5 bg-slate-950/30 rounded-xl border border-dashed border-slate-800 text-center text-[10px] text-slate-500">
                             🔒 Requiere Basic Skill Nivel 7
                          </div>
                        ) : (
                          <button
                            onClick={() => store.allocateSkillPoint(skill.id)}
                            disabled={!canLevelUp}
                            className={`w-full py-3 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                              canLevelUp
                                ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30 text-white cursor-pointer'
                                : isMax
                                ? 'bg-slate-950/20 border-transparent text-slate-500 cursor-not-allowed'
                                : 'bg-slate-950/10 border-transparent text-slate-550 cursor-not-allowed'
                            }`}
                          >
                            {isMax ? 'HABILIDAD AL MÁXIMO' : `SUBIR NIVEL (INVERTIR 1 PTO)`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* SCREEN 2: EQUIPMENT & MOBILE-TOUCH BACKPACK */}
            {activeTab === 'inventory' && (
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* Visual Equipment & Backpack Slots Split */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex flex-col">
                  
                  {/* Silhouette Equipment Plate (Alt+Q equivalent) */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 space-y-3 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                    <span className="text-[11px] font-black uppercase text-indigo-300 tracking-wider block drop-shadow-md">Equipamiento Activo del Personaje</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { slot: 'head', name: 'Cabeza', defaultIcon: <Crown className="w-5 h-5 text-slate-500" /> },
                        { slot: 'rightHand', name: 'Arma m.d.', defaultIcon: <Sword className="w-5 h-5 text-slate-500" /> },
                        { slot: 'leftHand', name: 'Escudo m.i.', defaultIcon: <Shield className="w-5 h-5 text-slate-500" /> },
                        { slot: 'body', name: 'Cuerpo', defaultIcon: <Activity className="w-5 h-5 text-slate-500" /> }
                      ].map((eqSlot) => {
                        const item = store.equippedItems[eqSlot.slot as EquipmentSlot];
                        const meta = item ? itemDetailsDb[item.id] : null;
                        const rStyle = item ? getRarityStyles(item.id) : null;
                        const isSelected = selectedItem && selectedItem.isEquipped && selectedItem.equippedSlot === eqSlot.slot;

                        return (
                          <button
                            key={eqSlot.slot}
                            onClick={() => {
                              if (item) {
                                setSelectedItem({
                                  ...item,
                                  quantity: 1,
                                  type: 'equipment',
                                  isEquipped: true,
                                  equippedSlot: eqSlot.slot as EquipmentSlot
                                });
                              } else {
                                setSelectedItem(null);
                              }
                            }}
                            className={`h-16 rounded-xl flex items-center gap-3 px-3 transition-all active:scale-[0.98] border font-sans select-none text-left relative overflow-hidden group ${
                              item 
                                ? `${rStyle?.border} hover:border-slate-600 bg-slate-900/80 cursor-pointer ${
                                    isSelected ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-950/40 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''
                                  }` 
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900 text-slate-500 hover:text-slate-400 cursor-default shadow-inner'
                            }`}
                            title={item ? `Ver ${item.name}` : `Ranura de ${eqSlot.name} disponible`}
                          >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 bg-slate-950/80 rounded-lg flex items-center justify-center text-2xl border border-slate-700/50 shadow-inner shrink-0 relative z-10">
                              {item ? (meta?.icon || '📦') : eqSlot.defaultIcon}
                            </div>
                            <div className="flex-1 min-w-0 relative z-10">
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider leading-none">
                                {eqSlot.name}
                              </span>
                              <span className="text-[11px] font-black text-slate-200 block truncate mt-1 leading-tight drop-shadow-md">
                                {item ? item.name : 'VACÍO'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Backpack filter pills */}
                  <div className="flex overflow-x-auto gap-2 pb-1.5 scrollbar-none select-none">
                    {[
                      { id: 'all', label: '🎒 TODO' },
                      { id: 'equipment', label: '⚔️ EQUIPOS' },
                      { id: 'consumable', label: '🧪 POCIONES' },
                      { id: 'material', label: '📦 VARIOS' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setBackpackTab(t.id as any);
                          setSelectedItem(null);
                        }}
                        className={`py-2.5 px-4 text-[11px] font-black tracking-wider rounded-xl shrink-0 transition-all active:scale-95 border uppercase ${
                          backpackTab === t.id 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                            : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Grid items */}
                  <div className="flex-1 min-h-[160px] overflow-y-auto pr-1">
                    {filteredInventory.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-8">
                        {filteredInventory.map((item) => {
                          const rStyle = getRarityStyles(item.id);
                          const isSelected = selectedItem && !selectedItem.isEquipped && selectedItem.id === item.id;
                          const meta = itemDetailsDb[item.id] || { icon: '📦' };

                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItem({ ...item, isEquipped: false })}
                              className={`aspect-square p-2 border rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 group overflow-hidden ${
                                rStyle.border
                              } hover:border-slate-600 bg-slate-900/60 ${
                                isSelected ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-indigo-950/40' : ''
                              }`}
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors pointer-events-none" />
                              <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10 transition-transform group-hover:scale-110">{meta.icon}</span>
                              <span className="text-[10px] font-bold text-center mt-2.5 truncate w-full text-slate-200 relative z-10 drop-shadow-md">
                                {item.name}
                              </span>

                              {item.quantity > 1 ? (
                                <span className="absolute bottom-2 right-2 bg-slate-950 border border-slate-700 text-[10px] font-mono leading-none font-black text-amber-400 px-1.5 py-0.5 rounded shadow-md z-20">
                                  x{item.quantity}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 h-full border-2 border-dashed border-slate-800/80 rounded-3xl text-slate-500 bg-slate-950/30 shadow-inner">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-500 uppercase select-none tracking-widest drop-shadow-md">Mochila Despejada</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Tactile Side Inspector Drawer */}
                <AnimatePresence mode="wait">
                  {selectedItem && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full md:w-[320px] bg-slate-900/60 backdrop-blur-xl border-t md:border-t-0 md:border-l-2 border-slate-700/50 p-6 flex flex-col justify-between shrink-0 overflow-y-auto shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="space-y-5 relative z-10">
                        <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-700/50 shadow-inner">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border tracking-widest leading-none ${
                            getRarityStyles(selectedItem.id).badge
                          }`}>
                            {itemDetailsDb[selectedItem.id]?.rarity === 'epic' ? 'ÉPICO' : itemDetailsDb[selectedItem.id]?.rarity === 'rare' ? 'RARO' : 'COMÚN'}
                          </span>
                          
                          {selectedItem.isEquipped && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest leading-none shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                              [ EQUIPADO ]
                            </span>
                          )}
                        </div>

                        {/* Title details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 bg-linear-to-r from-slate-950/60 to-transparent p-3 rounded-2xl border-l-[3px] border-indigo-500">
                            <div className="w-16 h-16 bg-slate-900/80 rounded-xl flex items-center justify-center text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-slate-700/50 shadow-inner shrink-0">
                              {itemDetailsDb[selectedItem.id]?.icon || '📦'}
                            </div>
                            <div>
                              <span className="font-display font-black text-lg block leading-none text-white tracking-wider text-shadow-md">{selectedItem.name}</span>
                              <span className="text-[11px] text-indigo-300 font-bold block leading-none mt-2 uppercase tracking-widest">Artículo del Reino</span>
                            </div>
                          </div>
                          
                          <p className="text-[13px] text-slate-300 font-medium leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                            {itemDetailsDb[selectedItem.id]?.desc || 'Objeto recolectado en tu trayecto.'}
                          </p>
                        </div>

                        {itemDetailsDb[selectedItem.id]?.statsDesc && (
                          <div className="p-3.5 bg-indigo-950/60 rounded-xl border border-indigo-500/30 text-[12px] font-bold text-indigo-200 flex items-start gap-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.4)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
                            <ArrowUp className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5 animate-bounce drop-shadow-md" />
                            <span className="leading-tight pt-0.5">{itemDetailsDb[selectedItem.id]?.statsDesc}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed border-t border-slate-800 pt-4">
                          "{itemDetailsDb[selectedItem.id]?.lore || 'Sin catalogar por la sociedad erudita.'}"
                        </p>
                      </div>

                      {/* Giant touch screen commands */}
                      <div className="space-y-4 mt-8 pt-5 border-t border-slate-800 relative z-10">
                        {selectedItem.isEquipped ? (
                          <button
                            onClick={() => handleUnequip(selectedItem.equippedSlot!, selectedItem.name)}
                            className="w-full py-4 bg-linear-to-b from-rose-600 to-rose-800 hover:brightness-110 active:scale-95 transition-all text-white font-black text-[13px] rounded-xl shadow-[0_5px_15px_rgba(225,29,72,0.4)] border-2 border-rose-400/50 uppercase tracking-widest cursor-pointer flex justify-center items-center gap-2 relative overflow-hidden"
                          >
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-xl" />
                            <span className="relative z-10 drop-shadow-md">Remover <span className="opacity-70 ml-1">⨯</span></span>
                          </button>
                        ) : (
                          <>
                            {selectedItem.type === 'equipment' ? (
                              <button
                                onClick={() => handleEquip(selectedItem)}
                                className="w-full py-4 bg-linear-to-b from-indigo-500 to-indigo-700 hover:brightness-110 active:scale-95 transition-all text-white font-black text-[13px] rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(79,70,229,0.5)] border-2 border-indigo-400/50 uppercase tracking-widest cursor-pointer relative overflow-hidden"
                              >
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-xl" />
                                <Crown className="w-5 h-5 text-indigo-200 relative z-10 drop-shadow-md" /> 
                                <span className="relative z-10 drop-shadow-md text-shadow-sm">Equipar Objeto</span>
                              </button>
                            ) : selectedItem.type === 'consumable' ? (
                              <button
                                onClick={() => handleUseConsumable(selectedItem)}
                                className="w-full py-4 bg-linear-to-b from-emerald-500 to-emerald-700 hover:brightness-110 active:scale-95 transition-all text-white font-black text-[13px] rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(16,185,129,0.4)] border-2 border-emerald-400/60 uppercase tracking-widest cursor-pointer relative overflow-hidden"
                              >
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-xl" />
                                <HeartHandshake className="w-5 h-5 text-emerald-200 animate-pulse relative z-10 drop-shadow-md" /> 
                                <span className="relative z-10 drop-shadow-md text-shadow-sm">Usar Consumible</span>
                              </button>
                            ) : (
                              <div className="h-12 flex items-center justify-center py-2 text-center bg-slate-950/80 border border-slate-800 text-[11px] font-black uppercase text-slate-500 rounded-xl leading-none tracking-widest shadow-inner">
                                Material sin uso directo
                              </div>
                            )}

                            {/* Tactile discard button */}
                            <button
                              onClick={() => handleDiscard(selectedItem)}
                              className="w-full py-3 bg-slate-950 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 text-slate-500 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-inner tracking-widest uppercase"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500/70" /> Descartar <span className="opacity-80 ml-1">x1</span>
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}

          </div>

          {/* Core dismissal area with standard large scale trigger */}
          <div className="flex justify-end select-none">
            <button
              onClick={onClose}
              className="py-4 px-8 bg-slate-900 border border-slate-700/80 font-black hover:bg-slate-850 text-white text-xs rounded-2xl active:scale-95 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 uppercase tracking-widest leading-none h-12 flex items-center justify-center"
            >
              Cerrar Panel Rúnico
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
}
