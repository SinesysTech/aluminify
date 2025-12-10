'use client'

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { getAvailableSlots } from "@/app/actions/agendamentos";

interface RightPanelProps {
  date: Date;
  timeZone: string;
  handleChangeAvailableTime: (time: string) => void;
  professorId: string;
}

export function RightPanel({
  date,
  timeZone,
  handleChangeAvailableTime,
  professorId,
}: RightPanelProps) {
  const locale = 'pt-BR';
  
  // Format day number and name
  const dayNumber = date.toLocaleDateString(locale, { day: "numeric", timeZone });
  const dayName = date.toLocaleDateString(locale, { weekday: "short", timeZone });
  
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      if (!professorId) return;
      setLoading(true);
      try {
        const dateStr = date.toISOString();
        const available = await getAvailableSlots(professorId, dateStr);
        // Remove duplicatas usando Set para garantir chaves únicas no React
        const uniqueSlots = Array.from(new Set(available));
        setSlots(uniqueSlots);
      } catch (error) {
        console.error("Failed to fetch slots", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [date, professorId, timeZone]);

  // Helper to format slot time (HH:MM)
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false, 
      timeZone: timeZone 
    });
  };

  return (
    <div className="flex flex-col gap-4 w-[280px] border-l pl-6">
      <div className="flex justify-between items-center">
        <p
          aria-hidden
          className="flex-1 align-center font-bold text-md text-gray-12 capitalize"
        >
          {dayName} <span className="text-gray-11">{dayNumber}</span>
        </p>
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
                    onClick={() => handleChangeAvailableTime(slotIso)}
                    key={slotIso}
                  >
                    {formatTime(slotIso)}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
    </div>
  );
}
