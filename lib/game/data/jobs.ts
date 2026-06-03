import { JobClass } from '../types';

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
