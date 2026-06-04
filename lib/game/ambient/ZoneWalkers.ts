import type { CityWalkerDef } from '../city/CityLifeSystem';

export function getFieldWalkers(): CityWalkerDef[] {
  return [
    {
      id: 'field_farmer_01',
      npcType: 'comerciante',
      name: 'Agricultor',
      speed: 0.7,
      route: [
        { x: 0, z: 0, pauseMs: 4000 },
        { x: 6, z: 4, pauseMs: 3000 },
        { x: 10, z: 2, pauseMs: 5000 },
        { x: 6, z: -2, pauseMs: 3000 },
        { x: 0, z: 0, pauseMs: 4000 },
      ],
    },
    {
      id: 'field_farmer_02',
      npcType: 'ciudadano',
      name: 'Campesina',
      speed: 0.8,
      route: [
        { x: -8, z: 6, pauseMs: 3000 },
        { x: -4, z: 10, pauseMs: 4000 },
        { x: 0, z: 8, pauseMs: 2000 },
        { x: -4, z: 4, pauseMs: 3000 },
      ],
    },
    {
      id: 'field_traveler_01',
      npcType: 'comerciante',
      name: 'Viajero',
      speed: 1.0,
      route: [
        { x: -20, z: -10, pauseMs: 2000 },
        { x: -14, z: -6, pauseMs: 1500 },
        { x: -8, z: -4, pauseMs: 3000 },
        { x: -14, z: -8, pauseMs: 2000 },
      ],
    },
    {
      id: 'field_kid_01',
      npcType: 'nino',
      name: 'Pastorcillo',
      speed: 1.8,
      route: [
        { x: 4, z: -8, pauseMs: 800 },
        { x: 8, z: -12, pauseMs: 500 },
        { x: 12, z: -8, pauseMs: 1000 },
        { x: 8, z: -4, pauseMs: 600 },
      ],
    },
  ];
}

export function getForestWalkers(): CityWalkerDef[] {
  return [
    {
      id: 'forest_hunter_01',
      npcType: 'ciudadano',
      name: 'Cazador',
      speed: 0.9,
      route: [
        { x: 0, z: 0, pauseMs: 3000 },
        { x: 5, z: 6, pauseMs: 2000 },
        { x: 10, z: 4, pauseMs: 4000 },
        { x: 6, z: -2, pauseMs: 2500 },
        { x: 0, z: 0, pauseMs: 3000 },
      ],
    },
    {
      id: 'forest_herbalist_01',
      npcType: 'comerciante',
      name: 'Herborista',
      speed: 0.6,
      route: [
        { x: -6, z: 8, pauseMs: 5000 },
        { x: -2, z: 12, pauseMs: 4000 },
        { x: 2, z: 10, pauseMs: 6000 },
        { x: -2, z: 6, pauseMs: 3000 },
      ],
    },
    {
      id: 'forest_worker_01',
      npcType: 'guardia',
      name: 'Leñador',
      speed: 0.8,
      route: [
        { x: 10, z: -10, pauseMs: 4000 },
        { x: 14, z: -6, pauseMs: 3000 },
        { x: 12, z: -2, pauseMs: 5000 },
        { x: 8, z: -6, pauseMs: 2000 },
      ],
    },
  ];
}

export function getRuinsWalkers(): CityWalkerDef[] {
  return [
    {
      id: 'ruins_explorer_01',
      npcType: 'comerciante',
      name: 'Explorador',
      speed: 0.8,
      route: [
        { x: 0, z: 0, pauseMs: 3000 },
        { x: 4, z: 6, pauseMs: 4000 },
        { x: 8, z: 4, pauseMs: 2000 },
        { x: 4, z: -2, pauseMs: 3000 },
      ],
    },
    {
      id: 'ruins_scholar_01',
      npcType: 'ciudadano',
      name: 'Erudito',
      speed: 0.5,
      route: [
        { x: -6, z: 4, pauseMs: 5000 },
        { x: -2, z: 8, pauseMs: 6000 },
        { x: -8, z: 6, pauseMs: 4000 },
      ],
    },
  ];
}

export function getDungeonWalkers(): CityWalkerDef[] {
  return [
    {
      id: 'dungeon_adventurer_01',
      npcType: 'guardia',
      name: 'Aventurero',
      speed: 0.9,
      route: [
        { x: 0, z: 0, pauseMs: 2000 },
        { x: 3, z: 5, pauseMs: 3000 },
        { x: -2, z: 8, pauseMs: 2000 },
        { x: -4, z: 3, pauseMs: 2500 },
      ],
    },
  ];
}

export function getLagoWalkers(): CityWalkerDef[] {
  return [
    {
      id: 'lago_fisher_01',
      npcType: 'ciudadano',
      name: 'Pescador',
      speed: 0.6,
      route: [
        { x: 0, z: 0, pauseMs: 6000 },
        { x: 4, z: 4, pauseMs: 5000 },
        { x: 8, z: 2, pauseMs: 7000 },
        { x: 4, z: -2, pauseMs: 4000 },
      ],
    },
    {
      id: 'lago_walker_01',
      npcType: 'ciudadano',
      name: 'Paseante',
      speed: 0.8,
      route: [
        { x: -6, z: 8, pauseMs: 3000 },
        { x: -2, z: 12, pauseMs: 2000 },
        { x: -8, z: 10, pauseMs: 3000 },
      ],
    },
  ];
}

export function getWalkersForMap(mapId: string): CityWalkerDef[] | null {
  switch (mapId) {
    case 'prontera_city':
      return null;
    case 'prontera_field':
    case 'campos_de_prontera_oeste':
    case 'laderas_molino':
    case 'camino_del_este':
    case 'pradera_alba':
    case 'colinas_ventosas':
      return getFieldWalkers();
    case 'bosque_umbrio':
    case 'bosque_de_prontera_sur':
    case 'bosque_umbrio_entrada':
    case 'bosque_umbrio_profundo':
      return getForestWalkers();
    case 'ruinas_ancestrales':
      return getRuinsWalkers();
    case 'costa_del_eco':
    case 'cueva_cristal':
      return null;
    case 'training_dungeon':
    case 'cueva_susurros':
    case 'santuario_olvidado':
    case 'echo_dungeon':
      return getDungeonWalkers();
    case 'castillo_olvidado':
      return null;
    default:
      return null;
  }
}
