"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProfessorDisponivel } from "@/app/[tenant]/(modules)/agendamentos/types"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/app/shared/components/forms/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, Calendar, Clock, Users, ChevronRight, ChevronLeft } from "lucide-react"

const ITEMS_PER_PAGE = 9

interface ProfessorSelectorProps {
  professores: ProfessorDisponivel[]
}

export function ProfessorSelector({ professores }: ProfessorSelectorProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredProfessores = professores.filter(professor => {
    const search = searchTerm.toLowerCase()
    return (
      professor.nome.toLowerCase().includes(search) ||
      professor.especialidade?.toLowerCase().includes(search) ||
      professor.email.toLowerCase().includes(search)
    )
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredProfessores.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProfessores = filteredProfessores.slice(startIndex, endIndex)

  // Reset to page 1 when search term changes
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSelectProfessor = (professorId: string) => {
    router.push(`/agendamentos/${professorId}`)
  }

  if (professores.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum professor disponível</EmptyTitle>
          <EmptyDescription>
            Não há professores com horários disponíveis no momento.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredProfessores.length} professor{filteredProfessores.length !== 1 ? "es" : ""} encontrado{filteredProfessores.length !== 1 ? "s" : ""}
      </p>

      {/* Professor list */}
      {filteredProfessores.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Nenhum resultado</EmptyTitle>
            <EmptyDescription>
              Nenhum professor encontrado com &quot;{searchTerm}&quot;
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProfessores.map((professor) => (
              <ProfessorCard
                key={professor.id}
                professor={professor}
                onSelect={() => handleSelectProfessor(professor.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  }
                  // Show ellipsis for gaps
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={page} className="px-1">...</span>
                  }
                  return null
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface ProfessorCardProps {
  professor: ProfessorDisponivel
  onSelect: () => void
}

function ProfessorCard({ professor, onSelect }: ProfessorCardProps) {
  const initials = professor.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const formatNextSlot = (isoString: string) => {
    const date = new Date(isoString)
    const isToday = new Date().toDateString() === date.toDateString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = tomorrow.toDateString() === date.toDateString()

    if (isToday) {
      return `Hoje às ${format(date, "HH:mm")}`
    } else if (isTomorrow) {
      return `Amanhã às ${format(date, "HH:mm")}`
    } else {
      return format(date, "EEE, dd/MM 'às' HH:mm", { locale: ptBR })
    }
  }

  return (
    <Card
      className="hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={professor.foto_url || undefined} alt={professor.nome} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{professor.nome}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {professor.especialidade && (
              <p className="text-sm text-muted-foreground truncate">
                {professor.especialidade}
              </p>
            )}

            {/* Availability status */}
            <div className="mt-2">
              {!professor.tem_disponibilidade ? (
                <Badge variant="secondary" className="text-xs">
                  Sem horários configurados
                </Badge>
              ) : professor.proximos_slots.length === 0 ? (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                  Agenda cheia
                </Badge>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Clock className="h-3 w-3" />
                  <span>Próximo: {formatNextSlot(professor.proximos_slots[0])}</span>
                </div>
              )}
            </div>

            {/* Bio preview */}
            {professor.bio && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {professor.bio}
              </p>
            )}
          </div>
        </div>

        {/* Action button */}
        {professor.tem_disponibilidade && professor.proximos_slots.length > 0 && (
          <Button
            className="w-full mt-4"
            variant="outline"
            size="sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Ver horários disponíveis
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
