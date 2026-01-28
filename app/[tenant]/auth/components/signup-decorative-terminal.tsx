'use client'

import { Check, Loader2, BookOpen, Users, Video, CreditCard } from 'lucide-react'

export function SignupDecorativeTerminal() {
  return (
    <div className="relative w-full max-w-md">
      {/* Glow Effect */}
      <div className="absolute -inset-4 rounded-full bg-blue-500 opacity-10 blur-[120px]" />

      {/* Card */}
      <div className="relative rounded-xl border border-gray-700 bg-[#0d1117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-[#161b22] px-4 py-3">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-2 text-xs text-gray-400">
            Preparando seu curso...
          </span>
        </div>

        {/* Content */}
        <div className="p-5 text-sm">
          {/* Title */}
          <div className="mb-4 text-center">
            <span className="text-white font-medium">O que você vai ter:</span>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Video className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <span className="font-medium text-white">Área do aluno</span>
                <p className="text-xs text-gray-500">Vídeo-aulas, materiais e progresso</p>
              </div>
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <span className="font-medium text-white">Gestão de alunos</span>
                <p className="text-xs text-gray-500">Matrículas e relatórios</p>
              </div>
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-medium text-white">Pagamentos</span>
                <p className="text-xs text-gray-500">Receba sem comissão</p>
              </div>
              <Check className="h-4 w-4 text-green-500 ml-auto" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span className="font-medium text-white">Sua marca</span>
                <p className="text-xs text-gray-500">Logo e cores personalizadas</p>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-amber-400 ml-auto" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-800 text-center">
            <span className="text-xs text-gray-500">Pronto em segundos após criar sua conta</span>
          </div>
        </div>
      </div>
    </div>
  )
}
