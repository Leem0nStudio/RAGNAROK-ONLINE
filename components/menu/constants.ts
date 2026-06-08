import { JobClass } from '../../lib/game/types';

export const jobInfo: Record<JobClass, { name: string; desc: string; role: string; focus: string; color: string; icon: string }> = {
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

export const statTooltips: Record<string, { title: string; desc: string }> = {
  str: { title: 'Fuerza (STR)', desc: 'Brinda +ATK cuerpo a cuerpo y aumenta la potencia de golpes físicos.' },
  agi: { title: 'Agilidad (AGI)', desc: 'Eleva el índice de esquiva (+FLEE) y velocidad de asalto (+ASPD).' },
  vit: { title: 'Vitalidad (VIT)', desc: 'Incrementa sustancialmente tu HP máximo (+Max HP) y mitigación de golpes.' },
  int: { title: 'Inteligencia (INT)', desc: 'Aumenta el poder de curación y ráfagas de poder sagrado (+Max SP).' },
  dex: { title: 'Destreza (DEX)', desc: 'Perfecciona tu precisión (+HIT) para asestar ataques infalibles.' },
  luk: { title: 'Suerte (LUK)', desc: 'Multiplica la probabilidad de golpes críticos masivos devastadores.' }
};

export const itemDetailsDb: Record<string, { desc: string; statsDesc?: string; lore: string; rarity: 'common' | 'rare' | 'epic'; icon: string }> = {
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
  },
  legendary_katar: {
    desc: 'Katar dual impregnado de sombras oscuras.',
    statsDesc: 'Fuerza extrema para asesinos: +65 ATK, +8 AGI, +15% de probabilidad crítica.',
    lore: 'Utilizado por asesinos de elite bajo las órdenes secretas de la hermandad.',
    rarity: 'epic',
    icon: '🗡️'
  },
  novice_shirt: {
    desc: 'Camisa simple de algodón entregada a novicios.',
    statsDesc: 'Defensa liviana inicial: +3 DEF.',
    lore: 'Ropa reglamentaria estándar provista por el centro de reclutamiento.',
    rarity: 'common',
    icon: '👕'
  },
  clip_of_wisdom: {
    desc: 'Un pequeño accesorio imbuido de sabiduría mágica.',
    statsDesc: 'Adaptabilidad de ranuras: +5 ATK, +2 DEF.',
    lore: 'Un pequeño clip adornado que brilla dulcemente al ponerse bajo la luz de la luna.',
    rarity: 'rare',
    icon: '💎'
  },
  baphomet_cape: {
    desc: 'Capa raída con hilos oscuros que solía pertenecer al MVP Baphomet.',
    statsDesc: 'Sombra protectora y velocidad: +12 DEF, +5 AGI.',
    lore: 'Sientes cómo el frío de las sombras te envuelve de forma agradable y protectora.',
    rarity: 'epic',
    icon: '👕'
  },
  pecopeco_mount: {
    desc: 'Un majestuoso PecoPeco domesticado del desierto.',
    statsDesc: 'Velocidad de montura: +15 AGI. Despierta tu espíritu de viaje.',
    lore: 'Bajo su mirada leal, correrás más rápido que el viento por las planicies prósperas.',
    rarity: 'rare',
    icon: '🐤'
  },
  poring_pet: {
    desc: 'Una esfera domesticadora que contiene un Poring feliz.',
    statsDesc: 'Compañero leal: +2 AGI, +5 ATK.',
    lore: 'Bota alegremente alrededor de tus pies, dándote buena suerte y un espíritu enérgico.',
    rarity: 'common',
    icon: '🟢'
  },
  angel_wing_costume: {
    desc: 'Alas divinas que se equipan como cosmético de espalda.',
    statsDesc: 'Cosmético espléndido: +10 ATK.',
    lore: 'Unas alas hermosas que parecen agitarse levemente ante flujos mágicos tibios.',
    rarity: 'epic',
    icon: '✨'
  }
};

export const jobColors: Record<JobClass, string> = {
  'Novice': 'from-slate-500 to-slate-700',
  'Swordsman': 'from-orange-600 to-red-600',
  'Crusader': 'from-yellow-600 to-orange-600',
  'Acolyte': 'from-teal-600 to-emerald-600',
  'Thief': 'from-purple-600 to-violet-600',
  'Rogue': 'from-slate-700 to-stone-800',
  'Archer': 'from-cyan-600 to-sky-600',
  'Mage': 'from-indigo-600 to-purple-600',
  'Sage': 'from-amber-600 to-orange-600',
  'Merchant': 'from-yellow-600 to-amber-600',
  'Knight': 'from-orange-700 to-red-800',
  'Wizard': 'from-blue-700 to-indigo-800',
  'Hunter': 'from-green-600 to-teal-700',
  'Bard': 'from-emerald-600 to-teal-700',
  'Dancer': 'from-rose-600 to-pink-700',
  'Priest': 'from-sky-500 to-blue-600',
  'Monk': 'from-stone-600 to-stone-700',
  'Blacksmith': 'from-zinc-600 to-zinc-800',
  'Alchemist': 'from-lime-600 to-green-700',
  'Assassin': 'from-purple-800 to-black',
  'Lord Knight': 'from-rose-500 to-red-700',
  'Paladin': 'from-yellow-500 to-amber-700',
  'High Wizard': 'from-purple-500 to-indigo-900',
  'Professor': 'from-amber-500 to-orange-900',
  'Sniper': 'from-sky-400 to-cyan-700',
  'Clown': 'from-emerald-500 to-teal-700',
  'Gypsy': 'from-rose-500 to-pink-700',
  'High Priest': 'from-emerald-400 to-teal-700',
  'Champion': 'from-stone-500 to-stone-700',
  'Whitesmith': 'from-orange-400 to-zinc-800',
  'Creator': 'from-lime-500 to-green-700',
  'Assassin Cross': 'from-fuchsia-500 to-purple-800',
  'Stalker': 'from-slate-600 to-stone-900',
};

export const defaultsForJob: Record<JobClass, any> = {
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
