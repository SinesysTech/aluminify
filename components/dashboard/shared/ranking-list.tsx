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
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case 1:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 2:
      return <Award className="h-4 w-4 text-amber-600" />
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
  maxHeight = '320px',
}: RankingListProps) {
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* PosiÃ§Ã£o com Ã­cone ou nÃºmero */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border',
                      getRankBadgeColor(index)
                    )}
                  >
                    {getRankIcon(index) || (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={item.avatarUrl || undefined} alt={item.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.secondaryValue && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.secondaryValue}
                      </p>
                    )}
                  </div>

                  {/* Valor principal */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">
                      {item.primaryValue}
                    </p>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
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
