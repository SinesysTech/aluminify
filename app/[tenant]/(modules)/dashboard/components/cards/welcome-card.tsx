import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export interface WelcomeCardProps {
  userName: string
  subtitle?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  streakDays?: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function WelcomeCard({
  userName,
  subtitle = "O que deseja aprender hoje?",
  description = "Descubra cursos, acompanhe seu progresso e alcance seus objetivos de aprendizado.",
  ctaLabel = "Explorar Cursos",
  ctaHref = "#",
  streakDays,
}: WelcomeCardProps) {
  const greeting = getGreeting()

  return (
    <Card className="overflow-hidden">
      <CardContent className="relative">
        <div className="grid items-center pt-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="font-display text-3xl">
              {greeting}, {userName}
              {streakDays != null && streakDays > 0 && (
                <span className="ml-2 text-base text-muted-foreground">
                  {streakDays} dias seguidos
                </span>
              )}
            </div>
            <div className="text-2xl">{subtitle}</div>
            <div className="text-muted-foreground">{description}</div>
            <div className="pt-2">
              <Button asChild>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
