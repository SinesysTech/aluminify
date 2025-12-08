'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export type Disponibilidade = {
  id?: string
  professor_id?: string
  dia_semana: number // 0-6
  hora_inicio: string // HH:MM
  hora_fim: string // HH:MM
  ativo: boolean
}

export type Agendamento = {
  id?: string
  professor_id: string
  aluno_id: string
  data_inicio: string | Date
  data_fim: string | Date
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  link_reuniao?: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export async function getDisponibilidade(professorId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', professorId)
    .eq('ativo', true)
    
  if (error) {
    console.error('Error fetching availability:', error)
    return []
  }
  
  return data
}

export async function upsertDisponibilidade(data: Disponibilidade) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const payload = {
    ...data,
    professor_id: user.id
  }

  const { error } = await supabase
    .from('agendamento_disponibilidade')
    .upsert(payload)
    .select()

  if (error) {
    console.error('Error upserting availability:', error)
    throw new Error('Failed to update availability')
  }

  revalidatePath('/agendamentos')
  return { success: true }
}

export async function getAgendamentos(professorId: string, start: Date, end: Date) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('professor_id', professorId)
    .gte('data_inicio', start.toISOString())
    .lte('data_fim', end.toISOString())
    .neq('status', 'cancelado') // Usually want to see occupied slots
    
  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }
  
  return data
}

export async function createAgendamento(data: Omit<Agendamento, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const payload = {
    ...data,
    aluno_id: user.id,
    status: 'pendente'
  }

  const { data: result, error } = await supabase
    .from('agendamentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    throw new Error('Failed to create appointment')
  }

  revalidatePath('/agendamentos')
  return result
}

export async function cancelAgendamento(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id)
    
    if (error) {
        console.error('Error cancelling appointment:', error)
        throw new Error('Failed to cancel appointment')
    }

    revalidatePath('/agendamentos')
    return { success: true }
}

export async function getAvailableSlots(professorId: string, dateStr: string) {
  const supabase = await createClient()
  
  const date = new Date(dateStr)
  // Ensure we are working with the date part only for dayOfWeek check if possible, but JS Date uses local or UTC. 
  // Let's rely on the input dateStr being ISO or YYYY-MM-DD.
  // Ideally, use a library like date-fns for timezone handling, but native is fine if careful.
  const dayOfWeek = date.getUTCDay() // 0-6
  
  // 1. Get availability rules
  const { data: rules } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', professorId)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)
    
  if (!rules || rules.length === 0) {
    return []
  }

  // 2. Get existing bookings
  const startOfDay = new Date(dateStr)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const { data: bookings } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('professor_id', professorId)
    .gte('data_inicio', startOfDay.toISOString())
    .lte('data_fim', endOfDay.toISOString())
    .neq('status', 'cancelado')

  // 3. Generate slots
  const slots: string[] = []
  const SLOT_DURATION_MINUTES = 30

  // Helper to parse "HH:MM:SS" or "HH:MM" to minutes from midnight
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  for (const rule of rules) {
    const startMins = timeToMinutes(rule.hora_inicio)
    const endMins = timeToMinutes(rule.hora_fim)
    
    for (let time = startMins; time + SLOT_DURATION_MINUTES <= endMins; time += SLOT_DURATION_MINUTES) {
      // Create slot date in UTC
      const slotStart = new Date(dateStr)
      slotStart.setUTCHours(Math.floor(time / 60), time % 60, 0, 0)
      
      const slotEnd = new Date(slotStart)
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + SLOT_DURATION_MINUTES)

      // Check collision
      const isOccupied = bookings?.some(booking => {
        const bookingStart = new Date(booking.data_inicio)
        const bookingEnd = new Date(booking.data_fim)
        // Overlap check
        return (slotStart < bookingEnd && slotEnd > bookingStart)
      })

      if (!isOccupied) {
        slots.push(slotStart.toISOString())
      }
    }
  }

  return slots.sort()
}
