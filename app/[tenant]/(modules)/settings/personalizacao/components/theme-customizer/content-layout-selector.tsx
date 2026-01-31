"use client";

import { Label } from "@/app/shared/components/forms/label";
import { useThemeConfig } from "@/components/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ContentLayoutSelector() {
  const { theme, setTheme } = useThemeConfig();

  type ContentLayout = 'full' | 'centered';

  const handleChange = (value: string | undefined) => {
    if (!value) return;
    const layout = value as ContentLayout;
    setTheme({ ...theme, contentLayout: layout });
  };

  return (
    <div className="hidden flex-col gap-4 lg:flex">
      <Label>Content layout</Label>
      <ToggleGroup
        value={theme.contentLayout}
        type="single"
        onValueChange={handleChange}
        className="*:border-input w-full gap-4 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="full">
          Full
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="centered"
          className="data-[variant=outline]:border-l">
          Centered
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
