"use client";

import { Label } from "@/components/ui/label";
import { useThemeConfig } from "@/components/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon } from "lucide-react";

export function ThemeScaleSelector() {
  const { theme, setTheme } = useThemeConfig();
  const scaleValues = {
    none: 1,
    sm: 0.95,
    lg: 1.05,
  } as const;

  type ScaleKey = keyof typeof scaleValues;

  const selectedScaleKey: ScaleKey =
    (Object.entries(scaleValues).find(([, val]) => String(val) === theme.scale)?.[0] as ScaleKey | undefined) || 'none';

  const handleChange = (value: string | undefined) => {
    if (!value) return;
    const nextScale = scaleValues[value as ScaleKey];
    if (typeof nextScale === 'number') {
      setTheme({ ...theme, scale: String(nextScale) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Label htmlFor="roundedCorner">Scale:</Label>
      <div>
        <ToggleGroup
          value={selectedScaleKey}
          type="single"
          onValueChange={handleChange}
          className="*:border-input w-full gap-3 *:rounded-md *:border">
          <ToggleGroupItem variant="outline" value="none">
            <BanIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            variant="outline"
            value="sm"
            className="text-xs data-[variant=outline]:border-l">
            XS
          </ToggleGroupItem>
          <ToggleGroupItem
            variant="outline"
            value="lg"
            className="text-xs data-[variant=outline]:border-l">
            LG
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
