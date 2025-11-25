'use client'

import * as React from 'react'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  className,
  error,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  // Atualizar input quando value mudar externamente
  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy', { locale: ptBR }))
    } else {
      setInputValue('')
    }
  }, [value])

  const validateAndSave = React.useCallback((input: string) => {
    if (!input || input.trim() === '') {
      onChange(null)
      setInputValue('')
      return
    }

    // Verificar se está no formato correto
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = input.match(datePattern)

    if (!match) {
      // Tentar parsear mesmo assim (pode estar incompleto mas válido)
      if (input.length === 10) {
        try {
          const parsed = parse(input, 'dd/MM/yyyy', new Date(), { locale: ptBR })
          if (isValid(parsed)) {
            const formatted = format(parsed, 'dd/MM/yyyy', { locale: ptBR })
            setInputValue(formatted)
            onChange(parsed)
            return
          }
        } catch {
          // Continuar para restaurar valor anterior
        }
      }
      
      // Restaurar valor anterior se inválido
      if (value) {
        setInputValue(format(value, 'dd/MM/yyyy', { locale: ptBR }))
      } else {
        setInputValue('')
        onChange(null)
      }
      return
    }

    // Validar e salvar
    try {
      const parsed = parse(input, 'dd/MM/yyyy', new Date(), { locale: ptBR })
      if (isValid(parsed)) {
        const formatted = format(parsed, 'dd/MM/yyyy', { locale: ptBR })
        setInputValue(formatted)
        onChange(parsed)
      } else {
        // Data inválida (ex: 31/02/2024)
        if (value) {
          setInputValue(format(value, 'dd/MM/yyyy', { locale: ptBR }))
        } else {
          setInputValue('')
          onChange(null)
        }
      }
    } catch {
      // Restaurar valor anterior em caso de erro
      if (value) {
        setInputValue(format(value, 'dd/MM/yyyy', { locale: ptBR }))
      } else {
        setInputValue('')
        onChange(null)
      }
    }
  }, [value, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const previousValue = inputValue

    // Se estiver deletando, permitir e atualizar normalmente
    if (newValue.length < previousValue.length) {
      setInputValue(newValue)
      if (newValue.length === 0) {
        onChange(null)
      }
      return
    }

    // Remover caracteres não numéricos para obter apenas os dígitos
    const cleaned = newValue.replace(/[^\d]/g, '')

    // Se não houver dígitos, limpar
    if (cleaned.length === 0) {
      setInputValue('')
      onChange(null)
      return
    }

    // Limitar a 8 dígitos (ddmmyyyy = 8 caracteres)
    const digitsOnly = cleaned.slice(0, 8)

    // Aplicar máscara dd/mm/yyyy
    let masked = ''
    for (let i = 0; i < digitsOnly.length; i++) {
      // Adicionar barra após o dia (posição 2) e após o mês (posição 4)
      if (i === 2 || i === 4) {
        masked += '/'
      }
      masked += digitsOnly[i]
    }

    setInputValue(masked)

    // Validar e salvar automaticamente quando completar a data (10 caracteres: dd/mm/yyyy)
    if (masked.length === 10) {
      // Usar setTimeout para garantir que o estado foi atualizado antes de validar
      setTimeout(() => {
        validateAndSave(masked)
      }, 0)
    }
  }

  const handleInputBlur = () => {
    validateAndSave(inputValue)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      // Pegar o valor atual diretamente do input para garantir que está atualizado
      const currentValue = e.currentTarget.value
      validateAndSave(currentValue)
      // Remover foco do input após Enter
      e.currentTarget.blur()
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date)
      setInputValue(format(date, 'dd/MM/yyyy', { locale: ptBR }))
    } else {
      onChange(null)
      setInputValue('')
    }
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          maxLength={10}
          className={cn(
            'flex-1',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-[40px] p-0',
                !value && 'text-muted-foreground',
                error && 'border-destructive'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleCalendarSelect}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

