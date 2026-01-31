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
import type { Teacher } from "@/app/[tenant]/(modules)/usuario/services/teacher.types"

interface AdminProfessorSelectorProps {
    professors: Teacher[]
    selectedProfessorId: string
    currentProfessorId: string
}

export function AdminProfessorSelector({
    professors,
    selectedProfessorId,
    currentProfessorId,
}: AdminProfessorSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleSelect = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams?.toString() ?? "")
            if (value === currentProfessorId) {
                params.delete("professorId")
            } else {
                params.set("professorId", value)
            }
            router.push(`${pathname}?${params.toString()}`)
        },
        [router, pathname, searchParams, currentProfessorId]
    )

    const selectedValue = selectedProfessorId === currentProfessorId ? "me" : selectedProfessorId

    return (
        <div className="flex items-center gap-4 p-4 mb-6 bg-muted/30 rounded-lg border">
            <div className="shrink-0">
                <Label className="text-sm font-medium">Gerenciar Agenda de:</Label>
            </div>
            <div className="w-[300px]">
                <Select value={selectedValue} onValueChange={handleSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um professor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="me">Minha Agenda (Eu)</SelectItem>
                        {professors
                            .filter((p) => p.id !== currentProfessorId)
                            .map((professor) => (
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
