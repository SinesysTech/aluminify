"use client"

import * as React from "react"
import { PlusCircle, CheckIcon } from "lucide-react"

import { cn } from "@/app/shared/library/utils"
import { Badge } from "@/app/shared/components/ui/badge"
import { Button } from "@/app/shared/components/ui/button"
import { Separator } from "@/app/shared/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/shared/components/overlay/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/app/shared/components/ui/command"

export interface FacetedFilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface FacetedFilterProps {
  title: string
  options: FacetedFilterOption[]
  selected: Set<string>
  onSelectionChange: (values: Set<string>) => void
  /** Permite selecionar múltiplas opções. Padrão: false (seleção única). */
  multiple?: boolean
  className?: string
}

export function FacetedFilter({
  title,
  options,
  selected,
  onSelectionChange,
  multiple = false,
  className,
}: FacetedFilterProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (multiple) {
      const next = new Set(selected)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      onSelectionChange(next)
    } else {
      // Seleção única: alterna entre selecionado e vazio
      if (selected.has(value)) {
        onSelectionChange(new Set())
      } else {
        onSelectionChange(new Set([value]))
      }
      setOpen(false)
    }
  }

  const handleClear = () => {
    onSelectionChange(new Set())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-dashed", className)}
        >
          <PlusCircle />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selected.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.size} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </div>
                    {option.icon && (
                      <option.icon className="size-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
