'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Trophy, Medal, Award } from 'lucide-react'

export interface RankingItem {
  id: string
  name: string
  avatarUrl: string | null
  primaryValue: string
  secondaryValue?: string
  badge?: string
}

interface RankingListProps {
  title: string
  items: RankingItem[]
  emptyMessage?: string
  className?: string
  maxHeight?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRankIcon(position: number) {
  switch (position) {
    case 0:
      return <Trophy className="h-3 w-3 text-yellow-500" />
    case 1:
      return <Medal className="h-3 w-3 text-gray-400" />
    case 2:
      return <Award className="h-3 w-3 text-amber-600" />
    default:
      return null
  }
}

function getRankBadgeColor(position: number): string {
  switch (position) {
    case 0:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 1:
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 2:
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-zinc-100 text-zinc-600 border-zinc-200'
  }
}

export function RankingList({
  title,
  items,
  emptyMessage = 'Nenhum item encontrado',
  className,
  maxHeight = '200px',
}: RankingListProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 px-3 pb-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className="h-48 pr-2">
            <div className="space-y-0.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border',
                      getRankBadgeColor(index)
                    )}
                  >
                    {getRankIcon(index) || <span>{index + 1}</span>}
                  </div>
                  <Avatar className="h-7 w-7 border">
                    <AvatarImage src={item.avatarUrl || undefined} alt={item.name} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    {item.secondaryValue && (
                      <p className="text-[10px] text-muted-foreground truncate">{item.secondaryValue}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">{item.primaryValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
