'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface FocusHeaderProps {
    presenceCount: number
}

export function FocusHeader({ presenceCount }: FocusHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Modo Foco</h1>
                <p className="text-muted-foreground mt-1">
                    Estudo imersivo com worker dedicado e monitoramento de distrações.
                </p>
            </div>
            <Badge variant="outline" className="text-sm">
                🟢 {presenceCount} estudando aqui
            </Badge>
        </div>
    )
}
