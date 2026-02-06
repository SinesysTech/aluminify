'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScheduleDashboard } from './schedule-dashboard'
import { ScheduleCalendarView } from './schedule-calendar-view'

interface CronogramaDetailViewProps {
  cronogramaId: string
}

export function CronogramaDetailView({ cronogramaId }: CronogramaDetailViewProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(tenant ? `/${tenant}/cronograma` : '/cronograma')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="lista" className="flex-1 sm:flex-initial">
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex-1 sm:flex-initial">
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          <ScheduleDashboard cronogramaId={cronogramaId} />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <ScheduleCalendarView cronogramaId={cronogramaId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
