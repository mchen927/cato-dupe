/**
 * Cato's visual theme — British Shorthair meets iOS.
 *
 * Inspired by a British Shorthair cat: soft blue-gray fur, warm copper eyes.
 * Clean iOS structure with warm, living color. Not sterile, not heavy.
 */

export const colors = {
  background: '#FAF8F5',
  backgroundSecondary: '#F3EFEA',
  card: '#FFFFFF',
  border: '#E8E4DE',
  borderLight: '#F0ECE6',

  textPrimary: '#2C2C2E',
  textSecondary: '#7A746C',
  textMuted: '#B0AAA0',
  textOnAccent: '#FFFFFF',

  accent: '#D4915E',
  accentDark: '#B87A4A',
  accentSoft: '#E8B892',
  accentLight: '#FFF3E8',

  catBubble: '#F5EDD6',
  userBubble: '#D4915E',

  tabBar: '#FAF8F5',
  tabActive: '#D4915E',
  tabInactive: '#B0AAA0',

  success: '#5AC66E',
  successLight: '#E8F8EB',
  warning: '#F5A623',
  warningLight: '#FFF4E5',
  danger: '#E85C5C',
  dangerLight: '#FFECEC',

  separator: 'rgba(60,60,67,0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  full: 9999,
};
