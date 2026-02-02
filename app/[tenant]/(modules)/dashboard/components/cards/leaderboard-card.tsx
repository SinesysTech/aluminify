import { ChevronRight } from "lucide-react"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface LeaderboardItem {
  id: string
  name: string
  points: number
  avatarUrl?: string | null
}

export interface LeaderboardCardProps {
  students: LeaderboardItem[]
  title?: string
  pointsLabel?: string
  onViewAll?: () => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function LeaderboardCard({
  students,
  title = "Ranking",
  pointsLabel = "pts",
  onViewAll,
}: LeaderboardCardProps) {
  if (students.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-muted-foreground text-sm">Sem dados de ranking</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        {onViewAll && (
          <CardAction className="-mt-2.5">
            <Button variant="outline" size="icon" onClick={onViewAll}>
              <ChevronRight />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student, index) => (
            <div key={student.id} className="flex items-center space-x-4">
              <span className="w-5 text-sm font-medium">{index + 1}.</span>
              <Avatar>
                <AvatarImage src={student.avatarUrl} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{student.name}</span>
              <Badge variant="outline">
                {student.points.toLocaleString("pt-BR")} {pointsLabel}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
