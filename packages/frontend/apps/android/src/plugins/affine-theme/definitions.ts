export interface AffineThemePlugin {
  onThemeChanged(options: { darkMode: boolean }): Promise<void>;
  getSystemNaviBarHeight(): Promise<{ height: number }>;
}
