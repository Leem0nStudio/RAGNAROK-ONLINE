export interface CardEffect {
  str?: number;
  agi?: number;
  int?: number;
  dex?: number;
  luk?: number;
  def?: number;
  maxHp?: number;
  flee?: number;
  matk?: number;
  spdPct?: number;
}

export const CARD_EFFECTS: Record<string, CardEffect> = {
  poring_card: { luk: 1 },
  lunatic_card: { agi: 1 },
  fabre_card: { def: 1 },
  chonchon_card: { int: 1 },
  picky_card: { dex: 1 },
  pecopeco_card: { agi: 2 },
  savage_baby_card: { str: 1 },
  mandragora_card: { maxHp: 100 },
  drainliar_card: { flee: 3 },
  spore_card: { maxHp: 50 },
  will_o_wisp_card: { int: 2 },
  argiope_card: { def: 3 },
  shining_plant_card: { matk: 3 },
  stalker_card: { agi: 2, dex: 1 },
  dark_guardian_card: { str: 3, maxHp: 200 },
};

export function getCombinedCardEffects(cardIds: string[]): CardEffect {
  const result: CardEffect = {};
  for (const id of cardIds) {
    const effect = CARD_EFFECTS[id];
    if (!effect) continue;
    for (const [key, val] of Object.entries(effect)) {
      const k = key as keyof CardEffect;
      result[k] = (result[k] || 0) + (val as number);
    }
  }
  return result;
}
