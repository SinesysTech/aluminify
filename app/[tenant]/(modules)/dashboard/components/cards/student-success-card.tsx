import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/feedback/progress"
import { ArrowUpIcon, ArrowDownIcon, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface StudentSuccessCardProps {
  currentSuccessRate: number
  previousSuccessRate: number
  totalStudents: number
  passingStudents: number
  title?: string
  totalLabel?: string
  passingLabel?: string
  onViewDetails?: () => void
}

export function StudentSuccessCard({
  currentSuccessRate,
  previousSuccessRate,
  totalStudents,
  passingStudents,
  title = "Taxa de Sucesso dos Alunos",
  totalLabel = "Total de Alunos",
  passingLabel = "Alunos Aprovados",
  onViewDetails,
}: StudentSuccessCardProps) {
  const successRateChange = currentSuccessRate - previousSuccessRate
  const isPositiveChange = successRateChange >= 0
  const passingPercentage = totalStudents > 0 ? (passingStudents / totalStudents) * 100 : 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-8 lg:space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-3xl lg:text-4xl">{currentSuccessRate}%</span>
          <div
            className={`flex items-center text-sm ${
              isPositiveChange ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpIcon className="mr-1 size-4" />
            ) : (
              <ArrowDownIcon className="mr-1 size-4" />
            )}
            <span className="font-medium">{Math.abs(successRateChange)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={currentSuccessRate} />
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Anterior: {previousSuccessRate}%</span>
            <span>Meta: 100%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-500" />
            <span className="font-medium">{totalLabel}</span>
          </div>
          <span className="font-bold">{totalStudents.toLocaleString("pt-BR")}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span className="font-medium">{passingLabel}</span>
            </div>
            <span className="font-bold">{passingStudents.toLocaleString("pt-BR")}</span>
          </div>
          <Progress value={passingPercentage} />
          <div className="text-muted-foreground text-sm">
            {passingPercentage.toFixed(1)}% do total
          </div>
        </div>
        {onViewDetails && (
          <Button variant="outline" className="w-full" onClick={onViewDetails}>
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
