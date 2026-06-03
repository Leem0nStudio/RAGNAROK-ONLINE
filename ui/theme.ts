export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const colors = {
  bg: {
    parchment: '#FDF5E6',
    oldPaper: '#F5EEDC',
    ivory: '#FFFFF0',
    warmBeige: '#F5F5DC',
    dark: '#0b0f19',
    black: '#000000',
  },
  border: {
    darkBrown: '#4A2E1D',
    woodBrown: '#6B4F3A',
    bronze: '#8C7853',
    light: 'rgba(74,46,29,0.6)',
  },
  bar: {
    hp: '#C0392B',
    hpBg: 'rgba(192,57,43,0.15)',
    sp: '#2980B9',
    spBg: 'rgba(41,128,185,0.15)',
    exp: '#F1C40F',
    expBg: 'rgba(241,196,15,0.15)',
    jobExp: '#8E44AD',
    jobExpBg: 'rgba(142,68,173,0.15)',
    bgDark: '#3D4852',
  },
  text: {
    nearBlack: '#1A1A1A',
    darkGray: '#333333',
    gray: '#666666',
    muted: '#888888',
    white: '#FFFFFF',
    mutedWhite: 'rgba(255,255,255,0.6)',
  },
  overlay: {
    dark: 'rgba(0,0,0,0.6)',
    medium: 'rgba(0,0,0,0.4)',
    light: 'rgba(0,0,0,0.15)',
  },
  glass: {
    dark: 'rgba(0,0,0,0.5)',
    medium: 'rgba(0,0,0,0.3)',
    light: 'rgba(0,0,0,0.15)',
  },
  accent: {
    primary: '#F1C40F',
    primaryBg: 'rgba(241,196,15,0.2)',
    danger: '#E74C3C',
    dangerBg: 'rgba(231,76,60,0.1)',
    success: '#2ECC71',
    successBg: 'rgba(46,204,113,0.1)',
    info: '#3498DB',
    infoBg: 'rgba(52,152,219,0.1)',
  },
} as const;

export const fontSizes = {
  xxs: '0.5rem',
  xs: '0.625rem',
  sm: '0.75rem',
  base: '0.875rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
} as const;

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  window: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

export const window = {
  headerBg: 'linear-gradient(180deg, #6B4F3A 0%, #4A2E1D 100%)',
  bodyBg: '#F5EEDC',
  borderColor: '#4A2E1D',
  borderSecondary: '#8C7853',
  shadow: shadows.window,
} as const;

export const bar = {
  hp: { color: colors.bar.hp, bg: colors.bar.hpBg },
  sp: { color: colors.bar.sp, bg: colors.bar.spBg },
  exp: { color: colors.bar.exp, bg: colors.bar.expBg },
  jobExp: { color: colors.bar.jobExp, bg: colors.bar.jobExpBg },
} as const;

export const hudScale = {
  permanentMaxPercent: 20,
  gameplayMinPercent: 80,
} as const;

export const slotSize = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiiKey = keyof typeof radii;
export type FontSizeKey = keyof typeof fontSizes;
