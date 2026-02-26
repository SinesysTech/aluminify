"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/app/shared/library/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/shared/components/overlay/sheet"

export interface BottomSheetOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  options: BottomSheetOption[]
  value?: string
  onSelect: (value: string) => void
  /** Permite múltipla seleção */
  multiple?: boolean
  /** Valores selecionados (para múltipla seleção) */
  values?: string[]
  /** Callback para múltipla seleção */
  onMultiSelect?: (values: string[]) => void
}

/**
 * BottomSheet otimizado para seleção de opções em dispositivos móveis.
 * Desliza de baixo para cima com opções tocáveis.
 *
 * @example
 * // Seleção única
 * <BottomSheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Selecione o período"
 *   options={[
 *     { value: 'morning', label: 'Manhã' },
 *     { value: 'afternoon', label: 'Tarde' },
 *   ]}
 *   value={selected}
 *   onSelect={(value) => {
 *     setSelected(value)
 *     setOpen(false)
 *   }}
 * />
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  options,
  value,
  onSelect,
  multiple = false,
  values = [],
  onMultiSelect,
}: BottomSheetProps) {
  const handleSelect = (optionValue: string) => {
    if (multiple && onMultiSelect) {
      const newValues = values.includes(optionValue)
        ? values.filter((v) => v !== optionValue)
        : [...values, optionValue]
      onMultiSelect(newValues)
    } else {
      onSelect(optionValue)
    }
  }

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return values.includes(optionValue)
    }
    return value === optionValue
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {/* Handle bar visual */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full" />

        <SheetHeader className="pt-4">
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[60vh] py-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 text-left",
                "transition-colors hover:bg-accent/50 active:bg-accent",
                "min-h-12", // Touch target
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected(option.value) && "bg-accent/30"
              )}
            >
              <div className="flex-1">
                <span
                  className={cn(
                    "text-base",
                    isSelected(option.value) && "font-medium"
                  )}
                >
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
              {isSelected(option.value) && (
                <Check className="h-5 w-5 text-primary shrink-0 ml-2" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Hook para usar BottomSheet em mobile e dropdown/select nativo em desktop.
 * Retorna true se deve usar BottomSheet (mobile).
 */
export function useBottomSheet() {
  const [shouldUseBottomSheet, setShouldUseBottomSheet] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setShouldUseBottomSheet(window.innerWidth < 768)
    }

    checkMobile()

    const mql = window.matchMedia("(max-width: 767px)")
    mql.addEventListener("change", checkMobile)

    return () => mql.removeEventListener("change", checkMobile)
  }, [])

  return shouldUseBottomSheet
}
