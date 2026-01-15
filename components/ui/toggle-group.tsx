import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        segmented:
          // Segmentado: borda só no container, itens ocupam 100% da altura/largura.
          // Importante: remove o padding lateral do size (px-1) para o highlight não “sobrar” nas bordas.
          // Não usar `overflow-hidden`: ele corta o botão (ex.: focus ring / arredondamento) em alguns layouts.
          "inline-flex items-stretch justify-center overflow-visible border border-input bg-transparent shadow-sm divide-x divide-border p-0 !px-0",
      },
      size: {
        default: "h-9 px-1",
        sm: "h-8 px-1",
        lg: "h-10 px-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleGroupVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(toggleGroupVariants({ variant, size }), className)}
    {...props}
  />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        segmented:
          // Segmentado: cada item preenche a altura do container e respeita o arredondamento externo.
          // Remove “retângulo”/borda extra no selecionado (sem inset border), deixando o highlight limpo.
          // Destaque do selecionado: mesmo padrão dos toggles "Semanal/Mensal/Anual" (bg-primary).
          // Obs: não usamos `shadow` no selecionado aqui porque o container é `overflow-hidden` (senão o highlight fica “cortado”).
          "h-full flex-1 rounded-none border-0 bg-transparent shadow-none leading-none hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:data-[state=on]:bg-primary/90 data-[state=on]:font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 first:rounded-l-md last:rounded-r-md",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleGroupItemVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(toggleGroupItemVariants({ variant, size }), className)}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
