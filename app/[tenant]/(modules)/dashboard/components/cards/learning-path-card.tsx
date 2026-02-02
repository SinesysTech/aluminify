import { GitBranch } from "lucide-react"
import Link from "next/link"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/feedback/progress"

export interface LearningPath {
  id: string
  name: string
  progress: number
  completedModules: number
  totalModules: number
  href?: string
}

export interface LearningPathCardProps {
  paths: LearningPath[]
  title?: string
}

const progressColors = ["bg-green-600", "bg-orange-600", "bg-blue-600", "bg-purple-600"]

export function LearningPathCard({
  paths,
  title = "Trilha de Aprendizado",
}: LearningPathCardProps) {
  if (paths.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardAction>
            <GitBranch className="text-muted-foreground size-4" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-muted-foreground text-sm">Nenhuma trilha encontrada</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <GitBranch className="text-muted-foreground size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {paths.map((path, index) => {
          const color = progressColors[index % progressColors.length]
          const content = (
            <div className="space-y-2">
              <div className="text-xl font-semibold">{path.name}</div>
              <Progress value={path.progress} indicatorColor={color} />
              <p className="text-muted-foreground text-xs">
                {path.completedModules} de {path.totalModules} modulos concluidos
              </p>
            </div>
          )

          if (path.href) {
            return (
              <Link
                key={path.id}
                href={path.href}
                className="hover:bg-muted block rounded-md border p-4 transition-colors"
              >
                {content}
              </Link>
            )
          }

          return (
            <div
              key={path.id}
              className="rounded-md border p-4"
            >
              {content}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
