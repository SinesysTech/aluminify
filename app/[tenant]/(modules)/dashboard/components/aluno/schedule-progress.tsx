import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"

interface ScheduleProgressProps {
  value: number
}

export function ScheduleProgress({ value }: ScheduleProgressProps) {
  return (
    <Card className="mb-6 bg-primary/5 border-primary/10">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso do Cronograma</span>
            <span className="text-muted-foreground">{value}% concluído</span>
          </div>
          <Progress value={value} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
