"use client";

import { DEFAULT_THEME, THEMES } from "@/lib/themes";
import { useThemeConfig } from "@/components/active-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function PresetSelector() {
  const { theme, setTheme } = useThemeConfig();

  const handlePreset = (value: string) => {
    // Check if it's a custom tenant preset
    const customPreset = theme.customPresets?.find(p => p.id === value);
    if (customPreset) {
      setTheme({
        ...theme,
        preset: value,
        radius: customPreset.radius,
        scale: customPreset.scale,
        mode: customPreset.mode,
      });
    } else {
      // Standard preset
      setTheme({ ...theme, ...DEFAULT_THEME, preset: value });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>Theme preset:</Label>
      <Select value={theme.preset} onValueChange={(value) => handlePreset(value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          {/* Standard presets */}
          {THEMES.map((themePreset) => (
            <SelectItem key={themePreset.name} value={themePreset.value}>
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 gap-1">
                  {themePreset.colors.map((color, key) => (
                    <span
                      key={key}
                      className="size-2 rounded-full"
                      style={{ backgroundColor: color }}></span>
                  ))}
                </div>
                {themePreset.name}
              </div>
            </SelectItem>
          ))}
          
          {/* Custom tenant presets */}
          {theme.customPresets && theme.customPresets.length > 0 && (
            <>
              <Separator className="my-2" />
              {theme.customPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex shrink-0 gap-1">
                      {preset.previewColors.map((color, key) => (
                        <span
                          key={key}
                          className="size-2 rounded-full"
                          style={{ backgroundColor: color }}></span>
                      ))}
                    </div>
                    <span>{preset.name}</span>
                    {preset.isDefault && (
                      <span className="text-xs text-muted-foreground">(Default)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
