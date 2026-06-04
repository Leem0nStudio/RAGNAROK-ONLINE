import { colors } from './theme';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityStyles {
  border: string;
  badge: string;
  color: string;
}

const RARITY_MAP: Record<Rarity, RarityStyles> = {
  common: { border: colors.rarityCommon, badge: colors.rarityCommonBg, color: colors.rarityCommon },
  uncommon: { border: colors.rarityUncommon, badge: colors.rarityUncommonBg, color: colors.rarityUncommon },
  rare: { border: colors.rarityRare, badge: colors.rarityRareBg, color: colors.rarityRare },
  epic: { border: colors.rarityEpic, badge: colors.rarityEpicBg, color: colors.rarityEpic },
  legendary: { border: colors.rarityLegendary, badge: colors.rarityLegendaryBg, color: colors.rarityLegendary },
};

export function getRarityStyles(rarity: string): RarityStyles {
  return RARITY_MAP[rarity as Rarity] ?? RARITY_MAP.common;
}
