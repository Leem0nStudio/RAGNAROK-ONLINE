import { ItemDetails } from '../types';

export const itemDetailsDb: Record<string, ItemDetails> = {
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
  training_sword: {
    desc: 'Espada de entrenamiento de madera reforzada.',
    statsDesc: 'Incrementa la potencia física: +5 ATK.',
    lore: 'El arma básica que todo Novice recibe al completar su primera prueba.',
    rarity: 'common',
    icon: '⚔️'
  },
  ring_of_life: {
    desc: 'Anillo forjado con esencia vital de los campos de Prontera.',
    statsDesc: 'Incrementa la salud máxima: +25 HP.',
    lore: 'Se dice que fue bendecido por los espíritus de la pradera.',
    rarity: 'rare',
    icon: '💍'
  },
  leather_armor: {
    desc: 'Armadura de cuero curtido flexible pero resistente.',
    statsDesc: 'Protección básica mejorada: +8 DEF.',
    lore: 'Hecha con piel de Savage Baby del molino. Resistente y ligera.',
    rarity: 'common',
    icon: '🦺'
  },
  copper_armor: {
    desc: 'Armadura de cobre batido con remaches de acero.',
    statsDesc: 'Protección sólida: +14 DEF.',
    lore: 'Usada por la guardia real de Prontera antes de la era del hierro.',
    rarity: 'rare',
    icon: '🛡️'
  },
  wing_boots: {
    desc: 'Botas ligeras con plumas de PecoPeco en los talones.',
    statsDesc: 'Aumenta la velocidad de movimiento: +3% SPD.',
    lore: 'Calzado predilecto de los mensajeros reales.',
    rarity: 'rare',
    icon: '👢'
  },
  cat_whisker: {
    desc: 'Un bigote de gato fino y elegante como accesorio.',
    statsDesc: 'Agudiza los reflejos: +3 FLEE.',
    lore: 'El gato de Clarice lo perdió mientras jugaba en los campos.',
    rarity: 'common',
    icon: '🐱'
  },
  poring_ear: {
    desc: 'Oreja decorativa de Poring de edición limitada.',
    statsDesc: 'Aporta un toque de suerte: +1 LUK.',
    lore: 'Hecho con la gelatina solidificada de un Poring especialmente rosado.',
    rarity: 'rare',
    icon: '👂'
  },
  apple_of_the_sun: {
    desc: 'Una manzana dorada que brilla con luz propia.',
    statsDesc: 'Otorga fuerza interna: +3 ATK.',
    lore: 'Fruta legendaria que solo crece en los árboles iluminados por el amanecer.',
    rarity: 'rare',
    icon: '🍎'
  },
  training_amulet: {
    desc: 'Amuleto de bronce otorgado a los graduados de la mazmorra.',
    statsDesc: 'Defensa básica: +3 DEF.',
    lore: 'Cada amuleto cuenta una historia de superación en las profundidades.',
    rarity: 'common',
    icon: '📿'
  },
  lunatic_tail: {
    desc: 'La cola esponjosa de un Lunático especialmente agresivo.',
    statsDesc: 'Aumenta la agilidad: +1 AGI.',
    lore: 'Los Lunáticos mudan la cola una vez al año. Esta está en perfecto estado.',
    rarity: 'rare',
    icon: '🦊'
  },
  chonchon_ear: {
    desc: 'Antena de Chonchon vibra con energía psíquica residual.',
    statsDesc: 'Mejora la inteligencia: +1 INT.',
    lore: 'Los estudiosos de Geffen pagan bien por estas antenas.',
    rarity: 'rare',
    icon: '📡'
  },
  picky_beak: {
    desc: 'Pico afilado de Picky conserva su filo natural.',
    statsDesc: 'Apunta con precisión: +1 DEX.',
    lore: 'Usado como punta de flecha por los arqueros novatos.',
    rarity: 'rare',
    icon: '🦜'
  },
  pecopeco_hat: {
    desc: 'Sombrero emplumado de PecoPeco con plumas exóticas.',
    statsDesc: 'Agilidad y defensa: +1 AGI, +1 DEF.',
    lore: 'Usar este sombrero es considerado un rito de paso entre los jinetes.',
    rarity: 'rare',
    icon: '🎩'
  },
  savage_tail: {
    desc: 'Cola de Savage Baby con púas conservadas.',
    statsDesc: 'Fuerza bruta: +1 STR.',
    lore: 'Los herreros usan las púas como agujas para coser armaduras.',
    rarity: 'rare',
    icon: '🦎'
  },
  mandragora_crown: {
    desc: 'Corona tejida con las raíces de la Mandrágora Gigante.',
    statsDesc: 'Vitalidad aumentada: +50 MaxHP.',
    lore: 'Quien porta esta corona siente la fuerza de la tierra fluir en sus venas.',
    rarity: 'epic',
    icon: '👑'
  },
  fur: {
    desc: 'Pelaje suave de Lunático.',
    statsDesc: 'Material textil básico.',
    lore: 'Sorprendentemente cálido y suave al tacto.',
    rarity: 'common',
    icon: '🧶'
  },
  claw: {
    desc: 'Garra pequeña pero afilada.',
    statsDesc: 'Material de artesanía.',
    lore: 'Puede usarse como punzón o como ingrediente de pociones.',
    rarity: 'common',
    icon: '🔪'
  },
  orange_potion: {
    desc: 'Poción naranja de recuperación media.',
    statsDesc: 'Restaura 45% del HP máximo.',
    lore: 'Más concentrada que la Red Potion. Sabor a cítricos.',
    rarity: 'common',
    icon: '🧪'
  },
  yellow_potion: {
    desc: 'Poción amarilla de recuperación avanzada.',
    statsDesc: 'Restaura 65% del HP máximo.',
    lore: 'Fórmula mejorada por los alquimistas de Geffen.',
    rarity: 'common',
    icon: '🧪'
  },
  blue_potion: {
    desc: 'Poción azul que restaura energía espiritual.',
    statsDesc: 'Recupera 30% del SP máximo.',
    lore: 'Destilada de plantas marinas de las costas de Alberta.',
    rarity: 'rare',
    icon: '💧'
  },
  white_potion: {
    desc: 'Poción blanca de recuperación total.',
    statsDesc: 'Restaura 100% del HP máximo.',
    lore: 'Elixir supremo de la vida. Caro pero invaluable en batalla.',
    rarity: 'rare',
    icon: '🧪'
  },
  green_potion: {
    desc: 'Poción verde que cura todos los males.',
    statsDesc: 'Recupera el 100% del HP y cura estados alterados.',
    lore: 'Preparación secreta de las hermanas Kafra.',
    rarity: 'epic',
    icon: '🧪'
  },
  fabre_wing: {
    desc: 'Ala translúcida de Fabre.',
    statsDesc: 'Material alquímico.',
    lore: 'Brilla con un tenue resplandor bajo la luz de la luna.',
    rarity: 'common',
    icon: '🦋'
  },
  feeler: {
    desc: 'Antena sensorial de Chonchon.',
    statsDesc: 'Componente de artesanía.',
    lore: 'Todavía se mueve. Los alquimistas lo consideran un ingrediente menor.',
    rarity: 'common',
    icon: '🌀'
  },
  feather: {
    desc: 'Pluma ligera de ave monstruosa.',
    statsDesc: 'Material para flechas y adornos.',
    lore: 'Las plumas de PecoPeco son las más cotizadas por los arqueros.',
    rarity: 'common',
    icon: '🪶'
  },
  picky_egg: {
    desc: 'Huevo de Picky intacto.',
    statsDesc: 'Ingrediente culinario exótico.',
    lore: 'Los cocineros de Prontera pagan bien por estos huevos.',
    rarity: 'rare',
    icon: '🥚'
  },
  pecopeco_egg: {
    desc: 'Huevo de PecoPeco de gran tamaño.',
    statsDesc: 'Material raro.',
    lore: 'Un solo huevo puede alimentar a una familia durante una semana.',
    rarity: 'rare',
    icon: '🥚'
  },
  savage_tooth: {
    desc: 'Diente de Savage Baby en perfecto estado.',
    statsDesc: 'Material de herrería.',
    lore: 'Los herreros lo usan para crear puntas de flecha perforantes.',
    rarity: 'common',
    icon: '🦷'
  },
  leather: {
    desc: 'Cuero crudo curtido.',
    statsDesc: 'Material de armaduría.',
    lore: 'La base de toda armadura ligera del reino.',
    rarity: 'common',
    icon: '🟫'
  },
  mandragora_root: {
    desc: 'Raíz de Mandrágora con propiedades mágicas.',
    statsDesc: 'Material de boss.',
    lore: 'Grita cuando se arranca. Los alquimistas la usan en sus experimentos más avanzados.',
    rarity: 'common',
    icon: '🌿'
  },
  mandragora_seed: {
    desc: 'Semilla de Mandrágora Gigante.',
    statsDesc: 'Material raro de boss.',
    lore: 'Si se planta, crece una Mandrágora en 100 años.',
    rarity: 'rare',
    icon: '🌱'
  },
  mandragora_flower: {
    desc: 'Flor carmesí de Mandrágora.',
    statsDesc: 'Componente alquímico raro.',
    lore: 'Florece solo una vez cada década.',
    rarity: 'rare',
    icon: '🌺'
  },
  poring_card: {
    desc: 'Carta de monstruo: Poring.',
    statsDesc: 'LUK +1. Insertar en equipamiento.',
    lore: 'Una carta que contiene la esencia de un Poring.',
    rarity: 'epic',
    icon: '🃏'
  },
  lunatic_card: {
    desc: 'Carta de monstruo: Lunático.',
    statsDesc: 'AGI +1. Insertar en equipamiento.',
    lore: 'La agilidad del Lunático queda sellada en esta carta.',
    rarity: 'epic',
    icon: '🃏'
  },
  fabre_card: {
    desc: 'Carta de monstruo: Fabre.',
    statsDesc: 'DEF +1. Insertar en equipamiento.',
    lore: 'La resistencia del Fabre protegida en forma de carta.',
    rarity: 'epic',
    icon: '🃏'
  },
  chonchon_card: {
    desc: 'Carta de monstruo: Chonchon.',
    statsDesc: 'INT +1. Insertar en equipamiento.',
    lore: 'El zumbido del Chonchon se escucha al sostener la carta.',
    rarity: 'epic',
    icon: '🃏'
  },
  picky_card: {
    desc: 'Carta de monstruo: Picky.',
    statsDesc: 'DEX +1. Insertar en equipamiento.',
    lore: 'Un aura de puntería envuelve al portador.',
    rarity: 'epic',
    icon: '🃏'
  },
  pecopeco_card: {
    desc: 'Carta de monstruo: PecoPeco.',
    statsDesc: 'AGI +2. Insertar en equipamiento.',
    lore: 'La velocidad del PecoPeco corre por tus venas.',
    rarity: 'epic',
    icon: '🃏'
  },
  savage_baby_card: {
    desc: 'Carta de monstruo: Savage Baby.',
    statsDesc: 'STR +1. Insertar en equipamiento.',
    lore: 'La fuerza salvaje del Savage Baby te abraza.',
    rarity: 'epic',
    icon: '🃏'
  },
  mandragora_card: {
    desc: 'Carta de monstruo: Mandrágora Gigante.',
    statsDesc: 'MaxHP +100. Insertar en equipamiento.',
    lore: 'El poder de la Mandrágora pulsa con vida propia.',
    rarity: 'epic',
    icon: '🃏'
  },
  wooden_sword: {
    desc: 'Espada de madera para Novice.',
    statsDesc: '+5 ATK. Para Novice.',
    lore: 'El primer "arma" de todo aventurero novato.',
    rarity: 'common',
    icon: '⚔️'
  },
  sword: {
    desc: 'Espada recta de acero.',
    statsDesc: '+15 ATK. Para Swordsman y derivados.',
    lore: 'El arma estándar de los Swordsman. Simple y letal.',
    rarity: 'common',
    icon: '🗡️'
  },
  staff: {
    desc: 'Báculo mágico de madera de nogal.',
    statsDesc: '+8 ATK, +12 MATK. Para Mage y derivados.',
    lore: 'Canaliza la energía arcana de forma eficiente.',
    rarity: 'common',
    icon: '🪄'
  },
  short_bow: {
    desc: 'Arco corto de caza.',
    statsDesc: '+10 ATK. Para Archer y derivados.',
    lore: 'Ligero y fácil de manejar. Ideal para principiantes.',
    rarity: 'common',
    icon: '🏹'
  },
  broad_sword: {
    desc: 'Espada ancha de caballería.',
    statsDesc: '+22 ATK. Para Swordsman/Knight.',
    lore: 'El peso de esta espada puede partir un escudo en dos.',
    rarity: 'rare',
    icon: '⚔️'
  },
  arc_wand: {
    desc: 'Báculo arcano con gema elemental.',
    statsDesc: '+10 ATK, +20 MATK. Para Mage/Wizard.',
    lore: 'La gema en la punta amplifica los hechizos de fuego y hielo.',
    rarity: 'rare',
    icon: '🪄'
  },
  long_bow: {
    desc: 'Arco largo de precisión.',
    statsDesc: '+18 ATK. Para Archer/Hunter.',
    lore: 'El alcance de este arco supera cualquier otra arma a distancia.',
    rarity: 'rare',
    icon: '🏹'
  },
  cotton_shirt: {
    desc: 'Camisa de algodón ligera.',
    statsDesc: '+3 DEF. Protección básica.',
    lore: 'Cómoda y transpirable. La favorita de los Novices.',
    rarity: 'common',
    icon: '👕'
  },
  feather_brooch: {
    desc: 'Broche con pluma exótica.',
    statsDesc: '+2% SPD. Elegancia y velocidad.',
    lore: 'Usado por los mensajeros reales para identificarse.',
    rarity: 'rare',
    icon: '📿'
  },
  leather_boots: {
    desc: 'Botas de cuero con suela reforzada.',
    statsDesc: '+2% SPD, +1 DEF.',
    lore: 'Calzado estándar del ejército de Prontera.',
    rarity: 'common',
    icon: '👢'
  },
  millers_blessing: {
    desc: 'Bendición del molinero. Restaura todas las fuerzas.',
    statsDesc: 'Recupera el 100% del HP al instante. Un solo uso.',
    lore: 'El molinero la preparó con hierbas de los prados del molino.',
    rarity: 'epic',
    icon: '🎁'
  },
  flour_sack: {
    desc: 'Saco de harina del molino de CM3.',
    statsDesc: 'Comida de campo: recupera 15% HP.',
    lore: 'Harina de trigo molida en el molino de las Laderas.',
    rarity: 'common',
    icon: '🫓'
  },
  green_herb: {
    desc: 'Hierba verde silvestre con propiedades curativas menores.',
    statsDesc: 'Material de pociones.',
    lore: 'Crece en los campos de Prontera. Las curanderas las recolectan al amanecer.',
    rarity: 'common',
    icon: '🌿'
  }
};
