"use client";

import { Label } from "@/app/shared/components/forms/label";
import { useThemeConfig } from "@/components/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon } from "lucide-react";

export function ThemeRadiusSelector() {
  const { theme, setTheme } = useThemeConfig();
  const radiusValues = {
    none: 0,
    sm: 0.25,
    md: 0.5,
    lg: 0.75,
    xl: 1,
  } as const;

  type RadiusKey = keyof typeof radiusValues;

  const selectedRadiusKey: RadiusKey =
    (Object.entries(radiusValues).find(([, val]) => String(val) === theme.radius)?.[0] as RadiusKey | undefined) || 'md';

  const handleChange = (value: string | undefined) => {
    if (!value) return;
    const nextRadius = radiusValues[value as RadiusKey];
    if (typeof nextRadius === 'number') {
      setTheme({ ...theme, radius: String(nextRadius) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Label htmlFor="roundedCorner">Radius:</Label>
      <ToggleGroup
        value={selectedRadiusKey}
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
          SM
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="md"
          className="text-xs data-[variant=outline]:border-l">
          MD
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="lg"
          className="text-xs data-[variant=outline]:border-l">
          LG
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="xl"
          className="text-xs data-[variant=outline]:border-l">
          XL
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
