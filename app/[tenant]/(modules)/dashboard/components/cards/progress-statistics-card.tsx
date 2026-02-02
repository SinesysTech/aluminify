import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/feedback/progress"
import { CalendarCheck2Icon, CalendarClockIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ProgressStatisticsCardProps {
  totalActivityPercent: number
  inProgressCount: number
  completedCount: number
  progressBars?: { value: number; color: string }[]
  title?: string
  inProgressLabel?: string
  completedLabel?: string
}

export function ProgressStatisticsCard({
  totalActivityPercent,
  inProgressCount,
  completedCount,
  progressBars,
  title = "Estatisticas de Progresso",
  inProgressLabel = "Em Andamento",
  completedLabel = "Concluidos",
}: ProgressStatisticsCardProps) {
  const bars = progressBars ?? [
    { value: Math.min(totalActivityPercent, 100), color: "bg-orange-500" },
    { value: Math.min(completedCount > 0 ? (completedCount / (completedCount + inProgressCount)) * 100 : 0, 100), color: "bg-green-500" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <div className="space-y-4 text-center">
          <div>Atividade Total</div>
          <div className="font-display text-3xl lg:text-4xl">
            {totalActivityPercent.toFixed(1)}%
          </div>
        </div>
        <div className="grid w-full gap-8 lg:grid-cols-2">
          {bars.map((bar, i) => (
            <div key={i} className="flex items-center gap-2">
              <Progress value={bar.value} indicatorColor={bar.color} />
              <div className="text-muted-foreground text-sm">{bar.value.toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary flex size-10 items-center justify-center rounded-lg">
                <CalendarClockIcon className="text-primary-foreground size-4" />
              </div>
              <span className="text-2xl font-semibold">{inProgressCount}</span>
            </div>
            <Badge className="h-auto bg-orange-500 px-4 py-2 text-sm">{inProgressLabel}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary flex size-10 items-center justify-center rounded-lg">
                <CalendarCheck2Icon className="text-primary-foreground size-4" />
              </div>
              <span className="text-2xl font-semibold">{completedCount}</span>
            </div>
            <Badge className="h-auto bg-green-500 px-4 py-2 text-sm">{completedLabel}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
