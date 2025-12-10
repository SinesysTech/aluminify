"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "./notification-item"
import { getNotificacoesUsuario, NotificacaoAgendamento } from "@/app/actions/notificacoes"

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoAgendamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotificacoes = async () => {
    setIsLoading(true)
    try {
      const data = await getNotificacoesUsuario(userId)
      setNotificacoes(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificacoes()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Count recent unread (last 24 hours for now)
  const recentCount = notificacoes.filter(n => {
    const createdAt = new Date(n.created_at)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return createdAt > oneDayAgo
  }).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {recentCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {recentCount > 9 ? "9+" : recentCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Notificacoes</h4>
          <p className="text-xs text-muted-foreground">
            {notificacoes.length === 0 ? "Nenhuma notificacao" : `${notificacoes.length} notificacoes`}
          </p>
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Voce nao tem notificacoes
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notificacao) => (
                <NotificationItem
                  key={notificacao.id}
                  notificacao={notificacao}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
