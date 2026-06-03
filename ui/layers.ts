export const layers = {
  world: 10,
  npcLabels: 50,
  hud: 100,
  windows: 200,
  tooltips: 300,
  modals: 400,
  notifications: 500,
} as const;

export type LayerKey = keyof typeof layers;
