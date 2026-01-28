'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface FocusHeaderProps {
    presenceCount: number
}

export function FocusHeader({ presenceCount }: FocusHeaderProps) {
    return (
        <header className="flex items-center justify-between gap-4">
            <div>
                <h1 className="page-title">Modo Foco</h1>
                <p className="page-subtitle mt-0.5">
                    Estudo imersivo para máxima concentração
                </p>
            </div>

            <Badge
                variant="outline"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-normal shrink-0"
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{presenceCount} estudando agora</span>
            </Badge>
        </header>
    )
}
