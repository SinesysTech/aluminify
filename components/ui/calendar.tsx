"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { ptBR } from "date-fns/locale/pt-BR"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={ptBR}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("pt-BR", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground opacity-40 aria-selected:text-muted-foreground aria-selected:opacity-40",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // Formata a data de forma consistente para evitar problemas de hidratação
  // Usa formato M/D/YYYY que é consistente entre servidor e cliente
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={formatDate(day.date)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-outside={modifiers.outside}
      className={cn(
        "relative isolate flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[2px] group-data-[focused=true]/day:ring-offset-1 group-data-[focused=true]/day:ring-offset-background dark:hover:text-accent-foreground",
        // Texto para seleção única - preto em ambos os modos
        "data-[selected-single=true]:text-black data-[selected-single=true]:font-semibold dark:data-[selected-single=true]:text-black",
        // Texto para range - preto em ambos os modos
        "data-[range-middle=true]:text-black data-[range-middle=true]:font-semibold dark:data-[range-middle=true]:text-black",
        "data-[range-start=true]:text-black data-[range-start=true]:font-semibold dark:data-[range-start=true]:text-black",
        "data-[range-end=true]:text-black data-[range-end=true]:font-semibold dark:data-[range-end=true]:text-black",
        // Background transparente para permitir o pseudo-elemento after
        "data-[selected-single=true]:bg-transparent data-[range-middle=true]:bg-transparent data-[range-start=true]:bg-transparent data-[range-end=true]:bg-transparent",
        // Pseudo-elemento after para o background destacado
        "data-[selected-single=true]:after:content-[''] data-[range-middle=true]:after:content-[''] data-[range-start=true]:after:content-[''] data-[range-end=true]:after:content-['']",
        "data-[selected-single=true]:after:absolute data-[range-middle=true]:after:absolute data-[range-start=true]:after:absolute data-[range-end=true]:after:absolute",
        "data-[selected-single=true]:after:inset-1 data-[range-middle=true]:after:inset-1 data-[range-start=true]:after:inset-1 data-[range-end=true]:after:inset-1",
        "data-[selected-single=true]:after:rounded-md data-[range-middle=true]:after:rounded-none data-[range-start=true]:after:rounded-l-md data-[range-end=true]:after:rounded-r-md",
        // Background com opacidade ajustada para melhor contraste (10% em ambos os modos)
        "data-[selected-single=true]:after:bg-primary/10 dark:data-[selected-single=true]:after:bg-primary/10",
        "data-[range-middle=true]:after:bg-primary/10 dark:data-[range-middle=true]:after:bg-primary/10",
        "data-[range-start=true]:after:bg-primary/10 dark:data-[range-start=true]:after:bg-primary/10",
        "data-[range-end=true]:after:bg-primary/10 dark:data-[range-end=true]:after:bg-primary/10",
        "data-[selected-single=true]:after:z-0 data-[range-middle=true]:after:z-0 data-[range-start=true]:after:z-0 data-[range-end=true]:after:z-0",
        "data-[selected-single=true]:after:pointer-events-none data-[range-middle=true]:after:pointer-events-none data-[range-start=true]:after:pointer-events-none data-[range-end=true]:after:pointer-events-none",
        // Estilos para o span interno (número do dia) - preto em ambos os modos
        "data-[selected-single=true]:[&>span]:text-black data-[selected-single=true]:[&>span]:font-semibold dark:data-[selected-single=true]:[&>span]:text-black",
        "data-[range-middle=true]:[&>span]:text-black data-[range-middle=true]:[&>span]:font-semibold dark:data-[range-middle=true]:[&>span]:text-black",
        "data-[range-start=true]:[&>span]:text-black data-[range-start=true]:[&>span]:font-semibold dark:data-[range-start=true]:[&>span]:text-black",
        "data-[range-end=true]:[&>span]:text-black data-[range-end=true]:[&>span]:font-semibold dark:data-[range-end=true]:[&>span]:text-black",
        "[&>span]:text-xs [&>span]:relative [&>span]:z-10",
        modifiers.outside && "opacity-40 text-muted-foreground",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
