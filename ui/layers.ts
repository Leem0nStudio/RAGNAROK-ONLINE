export const layers = {
  world: 0,
  combatFeedback: 10,
  hud: 20,
  notifications: 50,
  windows: 100,
  modals: 200,
  tooltips: 300,
  loading: 400,
} as const;

export type LayerKey = keyof typeof layers;
