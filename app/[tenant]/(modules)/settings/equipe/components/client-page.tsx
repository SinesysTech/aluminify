"use client"

import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import type { UsuarioSummary } from '@/app/shared/types/entities/usuario'
import { UserFilters } from './user-filters'
import { UserTable } from './user-table'
import { CreateMemberDialog } from './create-member-dialog'

interface EquipeClientPageProps {
  usuarios: UsuarioSummary[]
  initialFilter?: string
  currentUserIsAdmin: boolean
}

export function EquipeClientPage({ usuarios, initialFilter, currentUserIsAdmin }: EquipeClientPageProps) {
  const [papelTipoFilter, setPapelTipoFilter] = useState<string>(initialFilter || 'todos')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsuarios = useMemo(() => {
    let result = usuarios

    // Filtrar por papel_base ou flag admin
    if (papelTipoFilter && papelTipoFilter !== 'todos') {
      if (papelTipoFilter === 'admin') {
        result = result.filter(u => u.isAdmin)
      } else {
        result = result.filter(u => u.papelBase === papelTipoFilter)
      }
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

  // Contagem por papel_base + admin flag
  const countByTipo = useMemo(() => {
    const counts: Record<string, number> = { todos: usuarios.length }
    usuarios.forEach(u => {
      counts[u.papelBase] = (counts[u.papelBase] || 0) + 1
      if (u.isAdmin) {
        counts['admin'] = (counts['admin'] || 0) + 1
      }
    })
    return counts
  }, [usuarios])

  const isEmpty = usuarios.length === 0

  return (
    <div className="flex flex-col gap-8 h-full pb-10">
      {/* SECTION: POPULATED STATE */}
      {!isEmpty && (
        <section id="populated-state" className="flex flex-col gap-4 h-full min-h-[600px]">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <UserFilters
              papelTipoFilter={papelTipoFilter}
              onPapelTipoChange={setPapelTipoFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              countByTipo={countByTipo}
            />
            <CreateMemberDialog />
          </div>

          <UserTable usuarios={filteredUsuarios} currentUserIsAdmin={currentUserIsAdmin} />
        </section>
      )}

      {/* SECTION: EMPTY STATE */}
      {isEmpty && (
        <section id="empty-state" className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border">
            <Users className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
          </div>

          <h3 className="empty-state-title mb-2">Nenhum membro na equipe</h3>
          <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
            Ainda não há membros cadastrados na equipe desta empresa.
          </p>
          <CreateMemberDialog />
        </section>
      )}
    </div>
  )
}
