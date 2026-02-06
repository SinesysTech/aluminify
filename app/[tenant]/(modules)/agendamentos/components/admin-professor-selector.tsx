"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/shared/components/forms/select"
import { Label } from "@/app/shared/components/forms/label"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"

interface ProfessorOption {
    id: string
    fullName: string
}

interface AdminProfessorSelectorProps {
    professors: ProfessorOption[]
    selectedProfessorId: string
    /** ID do usuario logado */
    currentUserId: string
    /** Se o admin logado também é professor/monitor */
    isTeacher: boolean
}

export function AdminProfessorSelector({
    professors,
    selectedProfessorId,
    currentUserId,
    isTeacher,
}: AdminProfessorSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleSelect = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams?.toString() ?? "")
            if (value === "me") {
                params.delete("professorId")
            } else {
                params.set("professorId", value)
            }
            const qs = params.toString()
            router.push(qs ? `${pathname}?${qs}` : pathname)
        },
        [router, pathname, searchParams]
    )

    const selectedValue =
        isTeacher && selectedProfessorId === currentUserId
            ? "me"
            : selectedProfessorId

    const otherProfessors = professors.filter((p) => p.id !== currentUserId)

    return (
        <div className="flex items-center gap-4 p-4 mb-6 bg-muted/30 rounded-lg border">
            <div className="shrink-0">
                <Label className="text-sm font-medium">Gerenciar Agenda de:</Label>
            </div>
            <div className="w-75">
                <Select value={selectedValue} onValueChange={handleSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um professor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Visão Geral (Todos)</SelectItem>
                        {isTeacher && (
                            <SelectItem value="me">Minha Agenda (Eu)</SelectItem>
                        )}
                        {otherProfessors.map((professor) => (
                            <SelectItem key={professor.id} value={professor.id}>
                                {professor.fullName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
