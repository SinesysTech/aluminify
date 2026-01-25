// Re-export from active-theme for backward compatibility
export { DEFAULT_THEME, THEMES, type ExtendedThemeConfig } from '@/components/active-theme';

// Legacy ThemeType alias for backward compatibility
export type ThemeType = {
  preset: string;
  radius: string;
  scale: string;
  contentLayout: string;
};