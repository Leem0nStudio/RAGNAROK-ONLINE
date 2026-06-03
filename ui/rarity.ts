import { colors } from './theme';

export interface RarityStyles {
  border: string;
  badge: string;
  color: string;
}

export function getRarityStyles(rarity: string): RarityStyles {
  switch (rarity) {
    case 'epic': return { border: colors.accentAmber, badge: colors.accentAmberBg, color: colors.accentAmber };
    case 'rare': return { border: colors.accentIndigo, badge: colors.accentIndigoBg, color: colors.accentIndigo };
    default: return { border: colors.borderGray, badge: colors.borderGrayLight, color: colors.textGrayLower };
  }
}
