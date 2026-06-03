import { colors } from './theme';

export interface RarityStyles {
  border: string;
  badge: string;
  color: string;
}

export function getRarityStyles(rarity: string): RarityStyles {
  switch (rarity) {
    case 'legendary':
      return {
        border: colors.rarityLegendary,
        badge: colors.rarityLegendaryBg,
        color: colors.rarityLegendary,
      };
    case 'epic':
      return {
        border: colors.rarityEpic,
        badge: colors.rarityEpicBg,
        color: colors.rarityEpic,
      };
    case 'rare':
      return {
        border: colors.rarityRare,
        badge: colors.rarityRareBg,
        color: colors.rarityRare,
      };
    case 'uncommon':
      return {
        border: colors.rarityUncommon,
        badge: colors.rarityUncommonBg,
        color: colors.rarityUncommon,
      };
    case 'common':
    default:
      return {
        border: colors.rarityCommon,
        badge: colors.rarityCommonBg,
        color: colors.rarityCommon,
      };
  }
}
