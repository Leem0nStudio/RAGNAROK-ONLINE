import { CityWalkerDef } from './CityLifeSystem';

interface CityDecorPos {
  blueprintId: string;
  x: number;
  z: number;
  scale: number;
  rotationY: number;
}

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

export function getPronteraCityDecor(): CityDecorPos[] {
  return [
    // Faroles en avenida principal (Eje X)
    { blueprintId: 'lantern_wall', x: -18, z: 0, scale: 1.0, rotationY: 0 },
    { blueprintId: 'lantern_wall', x: -14, z: 12, scale: 1.0, rotationY: 0.5 },
    { blueprintId: 'lantern_wall', x: -10, z: -10, scale: 1.0, rotationY: -0.3 },
    { blueprintId: 'lantern_wall', x: 6, z: 14, scale: 1.0, rotationY: 0.8 },
    { blueprintId: 'lantern_wall', x: 14, z: 10, scale: 1.0, rotationY: 0 },
    { blueprintId: 'lantern_wall', x: 16, z: -4, scale: 1.0, rotationY: 0 },
    { blueprintId: 'lantern_wall', x: 18, z: -10, scale: 1.0, rotationY: -0.5 },
    { blueprintId: 'lantern_wall', x: -6, z: -14, scale: 1.0, rotationY: 0.3 },

    // Carros adicionales
    { blueprintId: 'cart', x: 6, z: 14, scale: 0.9, rotationY: 0.5 },
    { blueprintId: 'cart', x: -4, z: 18, scale: 1.0, rotationY: -0.3 },
    { blueprintId: 'cart', x: 14, z: -8, scale: 0.8, rotationY: 1.2 },

    // Puestos de mercado
    { blueprintId: 'stall', x: 11, z: -8, scale: 1.0, rotationY: 0.2 },
    { blueprintId: 'stall', x: 13, z: -4, scale: 1.0, rotationY: -0.1 },
    { blueprintId: 'stall', x: 9, z: -6, scale: 0.9, rotationY: 0.5 },

    // Jardineras
    { blueprintId: 'planter_box', x: 4, z: 10, scale: 1.0, rotationY: 0 },
    { blueprintId: 'planter_box', x: -4, z: 10, scale: 1.0, rotationY: 0.5 },
    { blueprintId: 'planter_box', x: 6, z: -10, scale: 1.0, rotationY: -0.3 },
    { blueprintId: 'planter_box', x: -6, z: -10, scale: 1.0, rotationY: 0.3 },

    // Cajas adicionales en mercado
    { blueprintId: 'crate_stack_2', x: 13, z: -5, scale: 0.8, rotationY: 0.5 },
    { blueprintId: 'crate_stack_2', x: 10, z: -7, scale: 1.0, rotationY: 1.2 },
    { blueprintId: 'crate_stack_2', x: 15, z: -3, scale: 0.9, rotationY: -0.4 },
    { blueprintId: 'barrel', x: 11, z: -3, scale: 1.0, rotationY: 0 },
    { blueprintId: 'barrel', x: 14, z: -6, scale: 0.9, rotationY: 0.8 },
    { blueprintId: 'barrel', x: 9, z: -9, scale: 1.1, rotationY: -0.5 },
  ];
}

/** Extra benches for city (beyond those in REST_AREA_BENCHES) */
export function getPronteraExtraBenches(): CityDecorPos[] {
  return [
    { blueprintId: 'bench', x: 20, z: 4, scale: 1.0, rotationY: 0.3 },
    { blueprintId: 'bench', x: 20, z: -4, scale: 1.0, rotationY: -0.3 },
    { blueprintId: 'bench', x: -4, z: 14, scale: 1.0, rotationY: 0.5 },
    { blueprintId: 'bench', x: 4, z: -14, scale: 1.0, rotationY: -0.5 },
    { blueprintId: 'bench', x: 0, z: -20, scale: 1.0, rotationY: 1.57 },
    { blueprintId: 'bench', x: 0, z: 20, scale: 1.0, rotationY: 1.57 },
  ];
}
