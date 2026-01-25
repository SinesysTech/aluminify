"use client";

import { useThemeConfig } from "@/components/active-theme";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME } from "@/app/shared/core/themes";

export function ResetThemeButton() {
  const { theme, setTheme } = useThemeConfig();

  const resetThemeHandle = () => {
    // Reset to default theme but preserve brand customization if available
    const resetTheme = {
      ...DEFAULT_THEME,
      // Preserve brand customization data
      customPresets: theme.customPresets,
      activeBranding: theme.activeBranding,
    };
    
    // If there's a default custom preset from tenant branding, apply it instead
    const defaultCustomPreset = theme.customPresets?.find(p => p.isDefault);
    if (defaultCustomPreset) {
      resetTheme.preset = defaultCustomPreset.id;
      resetTheme.radius = defaultCustomPreset.radius;
      resetTheme.scale = defaultCustomPreset.scale;
      resetTheme.mode = defaultCustomPreset.mode;
    }
    
    setTheme(resetTheme);
  };

  return (
    <Button className="mt-4 w-full" onClick={resetThemeHandle}>
      Reset to Default
    </Button>
  );
}
