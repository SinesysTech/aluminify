'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface PresenceBadgeProps {
    count: number
}

export function PresenceBadge({ count }: PresenceBadgeProps) {
    return (
        <Badge
            variant="outline"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-normal shrink-0"
        >
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{count} estudando agora</span>
        </Badge>
    )
}
