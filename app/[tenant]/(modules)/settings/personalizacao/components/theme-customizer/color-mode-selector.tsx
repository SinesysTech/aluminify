"use client";

import { Label } from "@/app/shared/components/forms/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "next-themes";
import { useThemeConfig } from "@/components/active-theme";

export function ColorModeSelector() {
  const { theme, setTheme } = useTheme();
  const { setTheme: setThemeConfig } = useThemeConfig();

  return (
    <div className="flex flex-col gap-4">
      <Label htmlFor="roundedCorner">Color mode:</Label>
      <ToggleGroup
        value={theme}
        type="single"
        onValueChange={(value: string) => {
          if (value) {
            setTheme(value);
            setThemeConfig({ mode: value as "light" | "dark" | "system" });
          }
        }}
        className="*:border-input w-full gap-4 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="light">
          Light
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="dark"
          className="data-[variant=outline]:border-l">
          Dark
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
