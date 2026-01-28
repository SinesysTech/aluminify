'use client'

import { Users, BookOpen, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function LoginDecorativeCard() {
  return (
    <Card className="w-full max-w-sm transform rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-transform duration-500 hover:rotate-0 -rotate-2 gap-0">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Seu painel</span>
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 ml-4" />
        <span className="text-xs text-green-600">Online</span>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {/* Alunos ativos */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Alunos ativos
            </span>
            <span className="text-xs font-medium text-gray-700">247</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[78%] rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Aulas assistidas */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Aulas assistidas hoje
            </span>
            <span className="text-xs font-medium text-gray-700">1.842</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[65%] rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Progresso médio */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">Progresso médio dos alunos</span>
            <span className="text-xs font-medium text-gray-700">72%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div className="h-1.5 w-[72%] rounded-full bg-amber-500" />
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-4 text-center">
        <span className="text-[11px] text-gray-400">Seus alunos estão estudando agora!</span>
      </div>
    </Card>
  )
}
