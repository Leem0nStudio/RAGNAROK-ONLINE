import { CityWalkerDef } from './CityLifeSystem';

export function getPronteraWalkers(): CityWalkerDef[] {
  return [
    // ── Guardias ──────────────────────────────────────────
    {
      id: 'guard_01',
      npcType: 'guardia',
      name: 'Guardia Real',
      speed: 1.2,
      route: [
        { x: -20, z: 0, pauseMs: 3000 },
        { x: -20, z: -8, pauseMs: 3000 },
      ],
    },
    {
      id: 'guard_02',
      npcType: 'guardia',
      name: 'Guardia de la Plaza',
      speed: 1.5,
      route: [
        { x: 0, z: 12, pauseMs: 2000 },
        { x: 8, z: 8, pauseMs: 1500 },
        { x: 12, z: 0, pauseMs: 2000 },
        { x: 8, z: -4, pauseMs: 1000 },
        { x: 0, z: 0, pauseMs: 2500 },
        { x: -6, z: 4, pauseMs: 1500 },
      ],
    },
    {
      id: 'guard_03',
      npcType: 'guardia',
      name: 'Guardia del Este',
      speed: 1.3,
      route: [
        { x: 22, z: 0, pauseMs: 3000 },
        { x: 18, z: -2, pauseMs: 1500 },
        { x: 14, z: 0, pauseMs: 1000 },
        { x: 18, z: 2, pauseMs: 1500 },
      ],
    },
    // ── Comerciantes ───────────────────────────────────────
    {
      id: 'trader_01',
      npcType: 'comerciante',
      name: 'Mercader Viajero',
      speed: 0.9,
      route: [
        { x: 10, z: -4, pauseMs: 4000 },
        { x: 12, z: -6, pauseMs: 5000 },
        { x: 14, z: -4, pauseMs: 3000 },
        { x: 12, z: -2, pauseMs: 2000 },
      ],
    },
    {
      id: 'trader_02',
      npcType: 'comerciante',
      name: 'Vendedora Ambulante',
      speed: 0.8,
      route: [
        { x: 0, z: 6, pauseMs: 3000 },
        { x: 4, z: 4, pauseMs: 2000 },
        { x: 8, z: 0, pauseMs: 2500 },
        { x: 12, z: -2, pauseMs: 4000 },
        { x: 8, z: 0, pauseMs: 2000 },
        { x: 4, z: 4, pauseMs: 1500 },
      ],
    },
    {
      id: 'trader_03',
      npcType: 'comerciante',
      name: 'Carretero',
      speed: 0.7,
      route: [
        { x: 8, z: 12, pauseMs: 2000 },
        { x: 4, z: 16, pauseMs: 3000 },
        { x: 0, z: 14, pauseMs: 2000 },
        { x: -4, z: 10, pauseMs: 1000 },
      ],
    },
    // ── Ciudadanos ────────────────────────────────────────
    {
      id: 'citizen_01',
      npcType: 'ciudadano',
      name: 'Ciudadano',
      speed: 1.0,
      route: [
        { x: 0, z: 0, pauseMs: 2000 },
        { x: 4, z: 2, pauseMs: 1500 },
        { x: 6, z: 6, pauseMs: 2500 },
        { x: 2, z: 8, pauseMs: 1000 },
        { x: -2, z: 6, pauseMs: 2000 },
        { x: -4, z: 2, pauseMs: 1500 },
      ],
    },
    {
      id: 'citizen_02',
      npcType: 'ciudadano',
      name: 'Ciudadana',
      speed: 0.9,
      route: [
        { x: -10, z: -4, pauseMs: 3000 },
        { x: -12, z: 0, pauseMs: 2000 },
        { x: -14, z: 2, pauseMs: 1500 },
        { x: -16, z: 0, pauseMs: 3000 },
        { x: -14, z: -2, pauseMs: 2000 },
      ],
    },
    {
      id: 'citizen_03',
      npcType: 'ciudadano',
      name: 'Paseante',
      speed: 1.1,
      route: [
        { x: 4, z: -6, pauseMs: 1000 },
        { x: 6, z: -10, pauseMs: 2000 },
        { x: 2, z: -12, pauseMs: 1500 },
        { x: -2, z: -8, pauseMs: 2500 },
        { x: 0, z: -4, pauseMs: 1000 },
      ],
    },
    // ── Niños ─────────────────────────────────────────────
    {
      id: 'kid_01',
      npcType: 'nino',
      name: 'Niño Travieso',
      speed: 2.0,
      route: [
        { x: 2, z: 6, pauseMs: 500 },
        { x: 4, z: 8, pauseMs: 800 },
        { x: 0, z: 10, pauseMs: 600 },
        { x: -2, z: 8, pauseMs: 500 },
        { x: 0, z: 6, pauseMs: 1000 },
        { x: 3, z: 5, pauseMs: 700 },
      ],
    },
    {
      id: 'kid_02',
      npcType: 'nino',
      name: 'Niña Curiosa',
      speed: 1.8,
      route: [
        { x: -8, z: -6, pauseMs: 1000 },
        { x: -10, z: -8, pauseMs: 500 },
        { x: -12, z: -6, pauseMs: 800 },
        { x: -10, z: -4, pauseMs: 600 },
        { x: -8, z: -6, pauseMs: 1200 },
      ],
    },
    {
      id: 'kid_03',
      npcType: 'nino',
      name: 'Niño Corredor',
      speed: 2.2,
      route: [
        { x: 0, z: -2, pauseMs: 400 },
        { x: 4, z: -4, pauseMs: 500 },
        { x: 6, z: 0, pauseMs: 600 },
        { x: 2, z: 2, pauseMs: 400 },
        { x: -2, z: 0, pauseMs: 800 },
      ],
    },
  ];
}
