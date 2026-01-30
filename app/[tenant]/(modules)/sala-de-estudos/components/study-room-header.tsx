'use client'

import { useMemo } from 'react'

interface StudyRoomHeaderProps {
  userName: string
}

// Frases motivacionais variadas para a sala de estudos
const motivationalPhrases = [
  (name: string) => `${name}, seu conhecimento cresce a cada dia!`,
  (name: string) => `Bons estudos, ${name}! Cada página conta.`,
  (name: string) => `${name}, o sucesso é construído passo a passo.`,
  (name: string) => `Foco e determinação, ${name}! Você consegue.`,
  (name: string) => `${name}, aprender é uma jornada incrível!`,
  (name: string) => `Que bom ter você aqui, ${name}! Vamos estudar?`,
  (name: string) => `${name}, cada esforço te aproxima do objetivo.`,
  (name: string) => `Sua dedicação inspira, ${name}! Continue assim.`,
  (name: string) => `${name}, o futuro pertence a quem se prepara.`,
  (name: string) => `Vamos lá, ${name}! Hoje é dia de aprender.`,
  (name: string) => `${name}, seu progresso é admirável!`,
  (name: string) => `Persistência é a chave, ${name}!`,
]

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

export function StudyRoomHeader({ userName }: StudyRoomHeaderProps) {
  const greeting = 'Olá'

  const firstName = userName.split(' ')[0]

  // Seleciona uma frase de forma determinística (pura) por nome
  const motivationalPhrase = useMemo(() => {
    const index = hashString(firstName) % motivationalPhrases.length
    return motivationalPhrases[index](firstName)
  }, [firstName])

  return (
    <header className="mb-6">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">
              {greeting}, {firstName}!
            </h1>
            <p className="page-subtitle mt-0.5">
              {motivationalPhrase}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            {greeting}, {userName}!
          </h1>
          <p className="page-subtitle">
            {motivationalPhrase}
          </p>
        </div>
      </div>
    </header>
  )
}
