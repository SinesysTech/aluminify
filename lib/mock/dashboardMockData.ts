import type { DashboardData } from '@/types/dashboard'

/**
 * Dados mock para o Dashboard Analytics do Aluno
 * Simula a resposta de uma API real
 */

// Função auxiliar para gerar array de dias do heatmap (365 dias)
function generateHeatmapData(): Array<{ date: string; intensity: number }> {
  const days: Array<{ date: string; intensity: number }> = []
  const startDate = new Date('2024-01-01')
  
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    // Gerar intensidade aleatória (0-4)
    // Distribuição: 20% vazio, 30% baixa, 30% média, 15% alta, 5% muito alta
    const rand = Math.random()
    let intensity = 0
    
    if (rand < 0.2) {
      intensity = 0
    } else if (rand < 0.5) {
      intensity = 1
    } else if (rand < 0.8) {
      intensity = 2
    } else if (rand < 0.95) {
      intensity = 3
    } else {
      intensity = 4
    }
    
    days.push({
      date: currentDate.toISOString().split('T')[0],
      intensity,
    })
  }
  
  return days
}

export const dashboardMockData: DashboardData = {
  user: {
    name: 'Gabriel',
    email: 'gabriel@email.com',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChAEQXoEE4k5LhW_luGcnHhnNacP195N-RO1PpDT2_7Gu6a7pxyQFHrz-mpmeNPMf95UO-m7iadJ8Lo5dshfUpfAh-uhGI8rGcWksXlWct4mqUTeDXRs7-rifn36jGmQ3PldkW8Lm2meguTB5mMziHPN1hLqmMB6ZYtpxoW5euFKGWUi9SWdOfscWFdFdUoOmkbxDCniMovWeTKEX-1zHmXjm6it6vaVqUeBkbFkgAPtZJWHTCihBkVEts-wP-R3vqMCSR8rj0AaI',
    streakDays: 15,
  },
  metrics: {
    scheduleProgress: 35,
    focusTime: '12h 30m',
    focusTimeDelta: '+2h',
    questionsAnswered: 145,
    questionsAnsweredPeriod: 'Essa semana',
    accuracy: 78,
    flashcardsReviewed: 850,
  },
  heatmap: generateHeatmapData(),
  subjects: [
    {
      id: 1,
      name: 'Geografia',
      front: 'Geopolítica',
      score: 35,
    },
    {
      id: 2,
      name: 'História',
      front: 'Geral',
      score: 40,
    },
    {
      id: 3,
      name: 'Matemática',
      front: 'Logaritmos',
      score: 65,
    },
    {
      id: 4,
      name: 'Biologia',
      front: 'Citologia',
      score: 71,
    },
    {
      id: 5,
      name: 'Física',
      front: 'Termodinâmica',
      score: 80,
    },
    {
      id: 6,
      name: 'Química',
      front: 'Orgânica',
      score: 92,
    },
  ],
  focusEfficiency: [
    {
      day: 'Seg',
      grossTime: 180, // 3 horas
      netTime: 135, // 2h15m (75% de eficiência)
    },
    {
      day: 'Ter',
      grossTime: 200, // 3h20m
      netTime: 140, // 2h20m (70% de eficiência)
    },
    {
      day: 'Qua',
      grossTime: 120, // 2 horas
      netTime: 60, // 1 hora (50% de eficiência)
    },
    {
      day: 'Qui',
      grossTime: 270, // 4h30m
      netTime: 229, // 3h49m (85% de eficiência)
    },
    {
      day: 'Sex',
      grossTime: 150, // 2h30m
      netTime: 68, // 1h8m (45% de eficiência)
    },
    {
      day: 'Sáb',
      grossTime: 210, // 3h30m
      netTime: 105, // 1h45m (50% de eficiência)
    },
    {
      day: 'Dom',
      grossTime: 120, // 2 horas
      netTime: 48, // 48 minutos (40% de eficiência)
    },
  ],
  strategicDomain: {
    baseModules: 90,
    highRecurrence: 60,
  },
  subjectDistribution: [
    {
      name: 'Física',
      percentage: 40,
      color: '#60a5fa', // blue-400
    },
    {
      name: 'Matemática',
      percentage: 30,
      color: '#a78bfa', // purple-400
    },
    {
      name: 'História',
      percentage: 20,
      color: '#facc15', // yellow-400
    },
    {
      name: 'Outros',
      percentage: 10,
      color: '#9ca3af', // gray-400
    },
  ],
}





