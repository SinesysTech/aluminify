'use client'

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateValue } from "@react-aria/calendar";
import { useLocale } from "@react-aria/i18n";
import { useEffect, useState } from "react";
import { getAvailableSlots } from "@/app/actions/agendamentos";

interface RightPanelProps {
  date: DateValue;
  timeZone: string;
  weeksInMonth: number;
  handleChangeAvailableTime: (time: string) => void;
  professorId: string;
}

export function RightPanel({
  date,
  timeZone,
  weeksInMonth,
  handleChangeAvailableTime,
  professorId,
}: RightPanelProps) {
  const { locale } = useLocale();
  const [dayNumber, dayName] = date
    .toDate(timeZone)
    .toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
    })
    .split(" ");
  
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      if (!professorId) return;
      setLoading(true);
      try {
        const dateStr = date.toDate(timeZone).toISOString();
        const available = await getAvailableSlots(professorId, dateStr);
        setSlots(available);
      } catch (error) {
        console.error("Failed to fetch slots", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [date, professorId, timeZone]);

  // Helper to format slot time (HH:MM or HH:MM AM/PM)
  const formatTime = (isoString: string, format: "12" | "24") => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: format === "12",
      timeZone: timeZone 
    });
  };

  return (
    <Tabs
      defaultValue="12"
      className="flex flex-col gap-4 w-[280px] border-l pl-6"
    >
      <div className="flex justify-between items-center">
        <p
          aria-hidden
          className="flex-1 align-center font-bold text-md text-gray-12"
        >
          {dayName} <span className="text-gray-11">{dayNumber}</span>
        </p>
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="12">12h</TabsTrigger>
          <TabsTrigger value="24">24h</TabsTrigger>
        </TabsList>
      </div>
      {["12", "24"].map((timeType) => (
        <TabsContent key={timeType} value={timeType}>
          <ScrollArea
            type="always"
            className="h-full"
            style={{
              maxHeight: weeksInMonth > 5 ? "380px" : "320px",
            }}
          >
            <div className="grid gap-2 pr-3">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center">Loading...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No slots available</p>
              ) : (
                slots.map((slotIso) => (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleChangeAvailableTime(
                        // Check if we need to pass full ISO or just time string
                        // The demo used time string "HH:MM", let's stick to full ISO if possible or adapt
                        // Demo index.tsx expects "time" string to parse.
                        // I'll update handleChangeAvailableTime handling in index.tsx
                        // For now let's pass the ISO string to be precise
                        slotIso 
                      )
                    }
                    key={slotIso}
                  >
                    {formatTime(slotIso, timeType as "12" | "24")}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
