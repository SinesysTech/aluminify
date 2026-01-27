"use client"

import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import type { UsuarioSummary } from '@/app/shared/types/entities/usuario'
import { UserFilters } from './user-filters'
import { UserTable } from './user-table'
import type { RoleTipo } from '@/app/shared/types/entities/papel'

interface EquipeClientPageProps {
  usuarios: UsuarioSummary[]
  initialFilter?: string
}

export function EquipeClientPage({ usuarios, initialFilter }: EquipeClientPageProps) {
  const [papelTipoFilter, setPapelTipoFilter] = useState<string>(initialFilter || 'todos')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsuarios = useMemo(() => {
    let result = usuarios

    // Filtrar por tipo de papel
    if (papelTipoFilter && papelTipoFilter !== 'todos') {
      result = result.filter(u => u.papelTipo === papelTipoFilter)
    }

    // Filtrar por busca (nome ou email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(u =>
        u.nomeCompleto.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }

    return result
  }, [usuarios, papelTipoFilter, searchQuery])

  // Contagem por tipo de papel
  const countByTipo = useMemo(() => {
    const counts: Record<string, number> = { todos: usuarios.length }
    usuarios.forEach(u => {
      counts[u.papelTipo] = (counts[u.papelTipo] || 0) + 1
    })
    return counts
  }, [usuarios])

  const isEmpty = usuarios.length === 0

  return (
    <div className="flex flex-col gap-8 h-full pb-10">
      {/* SECTION: POPULATED STATE */}
      {!isEmpty && (
        <section id="populated-state" className="flex flex-col gap-4 h-full min-h-[600px]">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
            <div>
              <h1 className="page-title">Equipe</h1>
              <p className="page-subtitle">
                {usuarios.length} membro(s) na equipe
                {filteredUsuarios.length !== usuarios.length
                  ? ` - ${filteredUsuarios.length} encontrado(s) com os filtros`
                  : ''
                }
              </p>
            </div>
          </header>

          <UserFilters
            papelTipoFilter={papelTipoFilter}
            onPapelTipoChange={setPapelTipoFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            countByTipo={countByTipo}
          />

          <UserTable usuarios={filteredUsuarios} />
        </section>
      )}

      {/* SECTION: EMPTY STATE */}
      {isEmpty && (
        <section id="empty-state" className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E4E4E7]">
            <Users className="w-8 h-8 text-zinc-400" strokeWidth={1} />
          </div>

          <h3 className="empty-state-title mb-2">Nenhum membro na equipe</h3>
          <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
            Ainda nao ha membros cadastrados na equipe desta empresa.
          </p>
        </section>
      )}
    </div>
  )
}
