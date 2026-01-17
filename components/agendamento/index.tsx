'use client'

import { Calendar } from "@/components/ui/calendar"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { FormPanel } from "./form-panel"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { ptBR } from "date-fns/locale"
import { getAvailabilityForMonth } from "@/app/actions/agendamentos"
import { Badge } from "@/components/ui/badge"
import { startOfMonth, endOfMonth, format } from "date-fns"

interface AgendamentoSchedulerProps {
  professorId: string
}

export function AgendamentoScheduler({ professorId }: AgendamentoSchedulerProps) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")
  const slotParam = searchParams.get("slot")
  const durationParam = searchParams.get("duration")

  // Default timezone to local or hardcoded for now
  const [timeZone] = React.useState("America/Sao_Paulo")

  // Initialize date from URL or undefined to avoid hydration mismatch
  // (server time != client time). We set 'today' in useEffect if no param.
  const initialDate = dateParam ? new Date(dateParam + 'T12:00:00') : undefined
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const [viewMonth, setViewMonth] = React.useState<Date>(initialDate || new Date())
  const [availability, setAvailability] = React.useState<{
    [date: string]: { hasSlots: boolean; slotCount: number }
  }>({})

  React.useEffect(() => {
    if (!date && !dateParam) {
      setDate(new Date())
    }
  }, [date, dateParam])

  // Fetch availability for the visible month
  React.useEffect(() => {
    const fetchAvailability = async () => {
      const year = viewMonth.getFullYear()
      const month = viewMonth.getMonth() + 1
      const data = await getAvailabilityForMonth(professorId, year, month)
      setAvailability(data)
    }
    fetchAvailability()
  }, [professorId, viewMonth])

  // Create modifier for days with availability
  const availableDays = Object.entries(availability)
    .filter(([_, info]) => info.hasSlots)
    .map(([dateStr]) => new Date(dateStr + 'T12:00:00'))

  const handleChangeDate = (newDate: Date | undefined) => {
    if (!newDate) return
    setDate(newDate)
    const url = new URL(window.location.href)
    // Format YYYY-MM-DD
    url.searchParams.set(
      "date",
      newDate.toISOString().split("T")[0],
    )
    // Clear slot and duration when date changes
    url.searchParams.delete("slot")
    url.searchParams.delete("duration")
    router.replace(url.toString(), { scroll: false })
  }

  const handleChangeAvailableTime = (slotIso: string, durationMinutes: number) => {
    // Slot is already ISO string from RightPanel
    const url = new URL(window.location.href)
    url.searchParams.set("slot", slotIso)
    url.searchParams.set("duration", String(durationMinutes))
    router.replace(url.toString(), { scroll: false })
  }

  const showForm = !!dateParam && !!slotParam

  return (
    <div className="w-full bg-background px-8 py-6 rounded-md max-w-max mx-auto border">
      <div className="flex gap-6">
        <LeftPanel
          showForm={showForm}
          timeZone={timeZone}
        />
        {!showForm ? (
          <>
            <div className="flex flex-col gap-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleChangeDate}
                onMonthChange={setViewMonth}
                locale={ptBR}
                className="rounded-md border"
                modifiers={{
                  available: availableDays,
                }}
                modifiersClassNames={{
                  available: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 font-semibold",
                }}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
              />
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300" />
                  <span>Disponivel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-muted border" />
                  <span>Sem horarios</span>
                </div>
              </div>
            </div>
            {date && (
              <RightPanel
                date={date}
                timeZone={timeZone}
                handleChangeAvailableTime={handleChangeAvailableTime}
                professorId={professorId}
              />
            )}
          </>
        ) : (
          <FormPanel
            professorId={professorId}
            timeZone={timeZone}
            durationMinutes={durationParam ? Number(durationParam) : 30}
          />
        )}
      </div>
    </div>
  )
}
