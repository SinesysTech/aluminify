'use client'

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { getAvailableSlots } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Clock } from "lucide-react"

interface RightPanelProps {
  date: Date
  timeZone: string
  handleChangeAvailableTime: (time: string, durationMinutes: number) => void
  professorId: string
}

export function RightPanel({
  date,
  timeZone,
  handleChangeAvailableTime,
  professorId,
}: RightPanelProps) {
  const locale = 'pt-BR'

  // Format day number and name
  const dayNumber = date.toLocaleDateString(locale, { day: "numeric", timeZone })
  const dayName = date.toLocaleDateString(locale, { weekday: "short", timeZone })

  const [slots, setSlots] = useState<string[]>([])
  const [slotDuration, setSlotDuration] = useState<number>(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchSlots() {
      if (!professorId) return
      setLoading(true)
      try {
        const dateStr = date.toISOString()
        const result = await getAvailableSlots(professorId, dateStr)
        
        // Type guard para verificar se result tem a estrutura esperada
        if (result && typeof result === 'object' && 'slots' in result && Array.isArray(result.slots)) {
          // Remove duplicatas usando Set para garantir chaves unicas no React
          const uniqueSlots = Array.from(new Set(result.slots)) as string[]
          setSlots(uniqueSlots)
          
          if ('slotDurationMinutes' in result) {
            setSlotDuration(result.slotDurationMinutes as number)
          }
        }
      } catch (error) {
        console.error("Failed to fetch slots", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [date, professorId, timeZone])

  // Helper to format slot time range (HH:MM - HH:MM)
  const formatTimeRange = (isoString: string, durationMinutes: number) => {
    const startDate = new Date(isoString)
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone
    }

    const startTime = startDate.toLocaleTimeString(locale, formatOptions)
    const endTime = endDate.toLocaleTimeString(locale, formatOptions)

    return `${startTime} - ${endTime}`
  }

  return (
    <div className="flex flex-col gap-4 w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p
            aria-hidden
            className="flex-1 align-center font-bold text-md text-foreground capitalize"
          >
            {dayName} <span className="text-muted-foreground">{dayNumber}</span>
          </p>
        </div>
        {!loading && slots.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Duração: {slotDuration} minutos</span>
          </div>
        )}
      </div>

      <ScrollArea
        type="always"
        className="h-full max-h-[320px]"
      >
        <div className="grid gap-2 pr-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center">Carregando...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">Sem horários disponíveis</p>
          ) : (
            slots.map((slotIso) => (
              <Button
                variant="outline"
                onClick={() => handleChangeAvailableTime(slotIso, slotDuration)}
                key={slotIso}
                className="justify-start"
              >
                {formatTimeRange(slotIso, slotDuration)}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
