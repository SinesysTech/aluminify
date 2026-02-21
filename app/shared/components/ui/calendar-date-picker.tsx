"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale/pt-BR";

import { cn } from "@/app/shared/library/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/app/shared/components/forms/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/shared/components/overlay/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/components/forms/select";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];


interface CalendarDatePickerProps {
  date?: DateRange;
  onDateSelect?: (date: DateRange | undefined) => void;
  numberOfMonths?: number;
  className?: string;
  timeZone?: string;
}

export const CalendarDatePicker = React.forwardRef<
  HTMLDivElement,
  CalendarDatePickerProps
>(
  (
    {
      date,
      onDateSelect,
      numberOfMonths = 2,
      className,
      timeZone = "America/Sao_Paulo",
    },
    _ref
  ) => {
    void _ref; // Forwarded ref intentionally unused in this implementation
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      null
    );
    const [highlightedPart, setHighlightedPart] = React.useState<
      "day" | "month" | "year" | null
    >(null);

    const [monthFrom, setMonthFrom] = React.useState<Date>(
      date?.from || new Date()
    );
    const [yearFrom, setYearFrom] = React.useState<number>(
      (date?.from || new Date()).getFullYear()
    );
    const [monthTo, setMonthTo] = React.useState<Date>(
      date?.to || new Date()
    );
    const [yearTo, setYearTo] = React.useState<number>(
      (date?.to || new Date()).getFullYear()
    );

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);

    const formatWithTz = (date: Date, formatStr: string) => {
      return formatInTimeZone(date, timeZone, formatStr);
    };

    const handleDateSelect = (range: DateRange | undefined) => {
      // Se já temos um range completo (from e to) e o usuário clicou em uma nova data,
      // resetar o range e começar um novo com a data clicada como from
      if (date?.from && date?.to && range?.from) {
        // Temos um range completo e o usuário clicou em uma nova data
        const clickedDate = range.from;
        const currentFrom = date.from;
        const currentTo = date.to;
        
        // Normalizar datas para comparar apenas dia/mês/ano (sem hora)
        const normalizeDate = (d: Date) => {
          const normalized = new Date(d);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };
        
        const clickedNormalized = normalizeDate(clickedDate);
        const fromNormalized = normalizeDate(currentFrom);
        const toNormalized = normalizeDate(currentTo);
        
        // Se a data clicada é diferente de ambas as datas do range atual, resetar
        if (
          clickedNormalized.getTime() !== fromNormalized.getTime() &&
          clickedNormalized.getTime() !== toNormalized.getTime()
        ) {
          // Resetar e começar um novo range com a data clicada
          const newRange: DateRange = {
            from: clickedDate,
            to: undefined,
          };
          if (onDateSelect) {
            onDateSelect(newRange);
          }
          setSelectedRange(null);
          // Atualizar o mês para mostrar a nova data selecionada
          setMonthFrom(clickedDate);
          setYearFrom(clickedDate.getFullYear());
          return;
        }
      }
      
      // Comportamento normal
      if (onDateSelect) {
        onDateSelect(range);
      }
      if (range?.from && range?.to) {
        setSelectedRange(null);
      }
    };

    const handleClose = () => {
      setIsPopoverOpen(false);
    };

    const handleMouseOver = (part: "day" | "month" | "year") => {
      setHighlightedPart(part);
    };

    const handleMouseLeave = () => {
      setHighlightedPart(null);
    };

    const selectDateRange = (
      start: Date,
      end: Date,
      label: string
    ) => {
      const range: DateRange = { from: start, to: end };
      handleDateSelect(range);
      setSelectedRange(label);
      setIsPopoverOpen(false);
    };

    const handleMonthChange = (
      monthName: string,
      type: "from" | "to"
    ) => {
      const monthIndex = months.indexOf(monthName);
      if (monthIndex === -1) return;
      const newDate = new Date(type === "from" ? monthFrom : monthTo);
      newDate.setMonth(monthIndex);
      if (type === "from") {
        setMonthFrom(newDate);
      } else {
        setMonthTo(newDate);
      }
    };

    const handleYearChange = (year: number, type: "from" | "to") => {
      const newDate = new Date(type === "from" ? monthFrom : monthTo);
      newDate.setFullYear(year);
      if (type === "from") {
        setMonthFrom(newDate);
        setYearFrom(year);
      } else {
        setMonthTo(newDate);
        setYearTo(year);
      }
    };

    const dateRanges = [
      {
        label: "Hoje",
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      },
      {
        label: "Esta Semana",
        start: startOfWeek(new Date(), { locale: ptBR }),
        end: endOfWeek(new Date(), { locale: ptBR }),
      },
      {
        label: "Este Mês",
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      },
      {
        label: "Este Ano",
        start: startOfYear(new Date()),
        end: endOfYear(new Date()),
      },
      {
        label: "Últimos 7 Dias",
        start: subDays(new Date(), 6),
        end: new Date(),
      },
      {
        label: "Últimos 30 Dias",
        start: subDays(new Date(), 29),
        end: new Date(),
      },
    ];

    return (
      <>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                {date?.from ? (
                  date.to ? (
                    <>
                      <span
                        id="day"
                        className={cn(
                          "date-part",
                          highlightedPart === "day" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("day")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "dd")}
                      </span>{" "}
                      <span
                        id="month"
                        className={cn(
                          "date-part",
                          highlightedPart === "month" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("month")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "LLL")}
                      </span>
                      ,{" "}
                      <span
                        id="year"
                        className={cn(
                          "date-part",
                          highlightedPart === "year" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("year")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "y")}
                      </span>{" "}
                      -{" "}
                      <span
                        id="day"
                        className={cn(
                          "date-part",
                          highlightedPart === "day" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("day")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.to, "dd")}
                      </span>{" "}
                      <span
                        id="month"
                        className={cn(
                          "date-part",
                          highlightedPart === "month" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("month")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.to, "LLL")}
                      </span>
                      ,{" "}
                      <span
                        id="year"
                        className={cn(
                          "date-part",
                          highlightedPart === "year" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("year")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.to, "y")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        id="day"
                        className={cn(
                          "date-part",
                          highlightedPart === "day" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("day")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "dd")}
                      </span>{" "}
                      <span
                        id="month"
                        className={cn(
                          "date-part",
                          highlightedPart === "month" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("month")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "LLL")}
                      </span>
                      ,{" "}
                      <span
                        id="year"
                        className={cn(
                          "date-part",
                          highlightedPart === "year" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("year")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "y")}
                      </span>
                    </>
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          {isPopoverOpen && (
            <PopoverContent
              className="w-auto"
              align="center"
              avoidCollisions={false}
              onInteractOutside={handleClose}
              onEscapeKeyDown={handleClose}
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
              }}
            >
              <div className="flex">
                {numberOfMonths === 2 && (
                  <div className="hidden md:flex flex-col gap-1 pr-4 text-left border-r border-foreground/10">
                    {dateRanges.map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start hover:bg-primary/90 hover:text-background",
                          selectedRange === label &&
                            "bg-primary text-background hover:bg-primary/90 hover:text-background"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label);
                          setMonthFrom(start);
                          setYearFrom(start.getFullYear());
                          setMonthTo(end);
                          setYearTo(end.getFullYear());
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 ml-3">
                      <Select
                        onValueChange={(value) => {
                          handleMonthChange(value, "from");
                          setSelectedRange(null);
                        }}
                        value={
                          monthFrom ? months[monthFrom.getMonth()] : undefined
                        }
                      >
                        <SelectTrigger className="hidden sm:flex w-30.5 focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, idx) => (
                            <SelectItem key={idx} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        onValueChange={(value) => {
                          handleYearChange(Number(value), "from");
                          setSelectedRange(null);
                        }}
                        value={yearFrom ? yearFrom.toString() : undefined}
                      >
                        <SelectTrigger className="hidden sm:flex w-30.5 focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year, idx) => (
                            <SelectItem key={idx} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {numberOfMonths === 2 && (
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            handleMonthChange(value, "to");
                            setSelectedRange(null);
                          }}
                          value={
                            monthTo ? months[monthTo.getMonth()] : undefined
                          }
                        >
                          <SelectTrigger className="hidden sm:flex w-30.5 focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          onValueChange={(value) => {
                            handleYearChange(Number(value), "to");
                            setSelectedRange(null);
                          }}
                          value={yearTo ? yearTo.toString() : undefined}
                        >
                          <SelectTrigger className="hidden sm:flex w-30.5 focus:ring-0 focus:ring-offset-0 font-medium hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year, idx) => (
                              <SelectItem key={idx} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex">
                    <Calendar
                      mode="range"
                      defaultMonth={monthFrom}
                      month={monthFrom}
                      onMonthChange={setMonthFrom}
                      selected={date}
                      onSelect={handleDateSelect}
                      numberOfMonths={numberOfMonths}
                      showOutsideDays={false}
                      className={className}
                      locale={ptBR}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </>
    );
  }
);

CalendarDatePicker.displayName = "CalendarDatePicker";

