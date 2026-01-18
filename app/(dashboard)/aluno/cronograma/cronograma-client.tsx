'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { ScheduleDashboard } from '@/components/aluno/schedule-dashboard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CalendarCheck, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CronogramaClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasCronograma, setHasCronograma] = useState(false)
  const [cronogramaId, setCronogramaId] = useState<string | null>(null)

  useEffect(() => {
    async function checkCronograma() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('cronogramas')
        .select('id')
        .eq('aluno_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>()

      if (error) {
        // Ignorar erro 400 se for relacionado a coluna 'ativo' inexistente
        // (pode ser cache do navegador com cÃ³digo antigo)
        if (error.code === 'PGRST116' || error.message?.includes('ativo')) {
          // Erro esperado - coluna 'ativo' nÃ£o existe na tabela cronogramas
          // Pode ser cache do navegador, nÃ£o logar
        } else {
          console.error('Erro ao buscar cronograma:', error)
        }
      }

      if (data) {
        setHasCronograma(true)
        setCronogramaId(data.id)
      }

      setLoading(false)
    }

    checkCronograma()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!hasCronograma) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CalendarCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Crie seu Cronograma de Estudos
            </CardTitle>
            <CardDescription className="text-base">
              Personalize seu plano de estudos com base na sua disponibilidade e
              objetivos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/aluno/cronograma/novo')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Cronograma
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ScheduleDashboard cronogramaId={cronogramaId!} />
}

