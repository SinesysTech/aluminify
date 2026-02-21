'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Target,
  Flame,
  BarChart3,
} from 'lucide-react'
import { Progress } from '@/app/shared/components/feedback/progress'
import { Skeleton } from '@/app/shared/components/feedback/skeleton'
import { cn } from '@/lib/utils'
import { AtividadeComProgresso } from '../types'

interface ProgressoStatsCardProps {
  atividades: AtividadeComProgresso[]
  streakDays?: number
  isStreakLoading?: boolean
  dailyGoal?: { completed: number; target: number }
  className?: string
}

export function ProgressoStatsCard({
  atividades,
  streakDays = 0,
  isStreakLoading = false,
  dailyGoal,
  className,
}: ProgressoStatsCardProps) {
  const stats = React.useMemo(() => {
    const total = atividades.length
    const pendentes = atividades.filter(
      (a) => !a.progressoStatus || a.progressoStatus === 'Pendente'
    ).length
    const iniciadas = atividades.filter((a) => a.progressoStatus === 'Iniciado').length
    const concluidas = atividades.filter((a) => a.progressoStatus === 'Concluido').length
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

    return {
      total,
      pendentes,
      iniciadas,
      concluidas,
      percentual,
    }
  }, [atividades])

  const streakMessage = React.useMemo(() => {
    if (streakDays === 0) return 'Comece sua jornada hoje!'
    if (streakDays < 3) return 'Continue assim!'
    if (streakDays < 7) return 'Você está no caminho certo!'
    if (streakDays < 14) return 'Impressionante consistência!'
    if (streakDays < 30) return 'Você é imparável!'
    return 'Lendário!'
  }, [streakDays])

  const motivationalContent = React.useMemo(() => {
    // Pools de mensagens por tier de performance (estilo Duolingo)
    const pools = {
      completed: [
        { emoji: '🏆', message: 'Você zerou tudo! Agora pode descansar... brincadeira, revisão existe por um motivo' },
        { emoji: '👑', message: '100%! Tô orgulhoso, mas não conta pra ninguém' },
        { emoji: '🎯', message: 'Completou tudo? Tá, agora me impressiona de novo amanhã' },
        { emoji: '🥇', message: 'Missão cumprida! Agora é só manter esse nível absurdo' },
        { emoji: '🐐', message: 'GOAT dos estudos. Não é eu que tô falando, são os números' },
        { emoji: '💅', message: 'Zerou com estilo. Esse é o main character energy que eu gosto' },
        { emoji: '🎭', message: 'Plot twist: você era o aluno exemplar esse tempo todo' },
        { emoji: '🧠', message: 'Cérebro tá no modo turbo. 100% é só o começo da lenda' },
        { emoji: '🪩', message: 'Pode comemorar, você merece. Mas amanhã tem mais, tá?' },
        { emoji: '🫡', message: 'Respeito total. Você desbloqueou o final secreto dos estudos' },
        { emoji: '✅', message: 'Tudo feito, tudo certo, tudo lindo. Agora repete no próximo ciclo' },
        { emoji: '🎪', message: 'Acabou o show? Que nada, agora vem o encore da revisão' },
        { emoji: '🦾', message: 'Modo implacável ativado e concluído. Você é diferenciado' },
        { emoji: '🌈', message: 'No final do arco-íris tinha 100% de progresso. Poético' },
        { emoji: '🍾', message: 'Abre o champanhe imaginário! Tudo concluído com sucesso' },
        { emoji: '💯', message: 'Literalmente 100. Nem preciso falar mais nada' },
        { emoji: '🏅', message: 'Se existisse speedrun de estudos, você tava no pódio' },
        { emoji: '🎓', message: 'Tá pronto pra formatura? Porque esse progresso diz que sim' },
        { emoji: '🐝', message: 'Trabalhou que nem abelha e agora tá colhendo o mel. Merecido' },
        { emoji: '🔮', message: 'Eu já sabia que você ia conseguir. Mentira, mas agora finjo que sim' },
      ],
      legend: [
        { emoji: '🔥', message: 'Você tá no modo lenda. Sério, eu tô impressionado' },
        { emoji: '⭐', message: 'Consistência de outro nível! Os outros alunos querem ser você' },
        { emoji: '💎', message: 'Se dedicação fosse moeda, você seria milionário' },
        { emoji: '🚀', message: 'Nesse ritmo, até o professor vai pedir suas anotações' },
        { emoji: '🐐', message: 'Tá jogando no modo lendário. O GOAT não para' },
        { emoji: '👾', message: 'Desbloqueou o modo hard e tá passando de fase fácil' },
        { emoji: '🧊', message: 'Frieza nos estudos tá absurda. Nenhuma distração te para' },
        { emoji: '🎭', message: 'POV: você é aquele aluno que todo mundo quer copiar a estratégia' },
        { emoji: '🦁', message: 'Tá com a mentalidade de leão. Consistência é seu superpoder' },
        { emoji: '💫', message: 'Esse brilho não é filtro, é dedicação real. Segue assim' },
        { emoji: '🏰', message: 'Construindo um império de conhecimento tijolo por tijolo' },
        { emoji: '🎯', message: 'Mira certeira todo dia. Você é basicamente um atirador de elite dos estudos' },
        { emoji: '⚔️', message: 'Modo guerreiro ativado faz tempo e você não desliga nunca' },
        { emoji: '🌋', message: 'Essa erupção de produtividade não tem previsão de acabar' },
        { emoji: '🧬', message: 'Tá no DNA. Estudar todo dia já virou parte de quem você é' },
        { emoji: '🪐', message: 'Tá orbitando em outro nível. Terrestre não consegue acompanhar' },
        { emoji: '🎪', message: 'Os outros assistem, você performa. Palco é seu' },
        { emoji: '🥷', message: 'Silenciosamente dominando. Ninja dos estudos é você' },
        { emoji: '🏋️', message: 'Treino pesado todo dia e os resultados tão mostrando' },
        { emoji: '👁️', message: 'Eu vejo tudo. E o que eu vejo aqui é pura excelência' },
      ],
      onFire: [
        { emoji: '🔥', message: 'Tá pegando fogo, bichoo! Não para agora!' },
        { emoji: '💪', message: 'Esse ritmo tá cheirando a aprovação de longe' },
        { emoji: '⚡', message: 'Mais um pouquinho e você vira lenda. Bora?' },
        { emoji: '🎸', message: 'Mandando bem demais! Continue nessa pegada' },
        { emoji: '🫶', message: 'Tô shipando você com o sucesso. Casal perfeito' },
        { emoji: '🎢', message: 'Essa curva de progresso tá mais bonita que montanha-russa' },
        { emoji: '🧨', message: 'Tá explodindo de produtividade! Cuidado que é contagioso' },
        { emoji: '🏄', message: 'Surfando na onda da motivação. Não cai dessa prancha' },
        { emoji: '🎮', message: 'Combo de acertos! Alguém avisa que o joystick tá pegando fogo' },
        { emoji: '🌊', message: 'Essa onda de estudos tá gigante e você tá no topo dela' },
        { emoji: '⭐', message: 'Tá brilhando tanto que eu preciso de óculos escuros aqui' },
        { emoji: '🦅', message: 'Voando alto! A vista de cima é bonita, né?' },
        { emoji: '🎯', message: 'Acertando na mosca repetidamente. Isso não é sorte, é preparo' },
        { emoji: '🚂', message: 'Trem da produtividade sem freio. Próxima estação: lendário' },
        { emoji: '🌡️', message: 'Temperatura dos estudos: fervendo. Não deixa esfriar' },
        { emoji: '🎵', message: 'Esse ritmo de estudos merecia uma playlist própria' },
        { emoji: '🔋', message: 'Bateria de motivação em 90%. Só carregando mais um pouco' },
        { emoji: '🧗', message: 'Escalando sem parar. O topo tá cada vez mais perto' },
        { emoji: '💥', message: 'Boom! Cada dia um progresso novo. Isso que é consistência' },
        { emoji: '🌟', message: 'Main character energy dos estudos. O roteiro é seu' },
      ],
      doingWell: [
        { emoji: '📈', message: 'Metade do caminho andado! A outra metade tá te esperando' },
        { emoji: '💡', message: 'Nada mal! Mas eu sei que você consegue mais' },
        { emoji: '🧭', message: 'Progresso constante vence sprint desesperado. Confia no processo' },
        { emoji: '✨', message: 'Você tá evoluindo! Daqui a pouco nem vai se reconhecer' },
        { emoji: '🐢', message: 'Devagar e sempre ganha a corrida. A tartaruga tava certa o tempo todo' },
        { emoji: '🧩', message: 'Cada atividade é uma peça do quebra-cabeça. Tá encaixando bonito' },
        { emoji: '🎬', message: 'Arco de desenvolvimento do protagonista tá ficando bom' },
        { emoji: '🌤️', message: 'Depois da chuva vem o sol. E depois do estudo vem a aprovação' },
        { emoji: '🔑', message: 'Tá desbloqueando conquistas no modo silencioso. Respeito' },
        { emoji: '🪴', message: 'Plantando hoje pra colher amanhã. Jardineiro dos estudos' },
        { emoji: '🎲', message: 'As chances tão cada vez mais a seu favor. Continue jogando' },
        { emoji: '📱', message: 'Esse progresso merecia um story. Mas foca nos estudos primeiro' },
        { emoji: '🧱', message: 'Roma não foi construída em um dia, mas olha o progresso da obra' },
        { emoji: '🎈', message: 'Subindo aos poucos, mas subindo. Isso que importa' },
        { emoji: '🗺️', message: 'O mapa tá traçado, o caminho tá sendo percorrido. Segue o GPS' },
        { emoji: '☕', message: 'Um café e mais uma atividade. Ritual de quem tá comprometido' },
        { emoji: '🎧', message: 'No seu ritmo, no seu tempo, mas sempre avançando. Isso é o que vale' },
        { emoji: '🌱', message: 'A sementinha tá crescendo! Rega todo dia que vira árvore' },
        { emoji: '🧘', message: 'Equilíbrio perfeito entre esforço e constância. Zen dos estudos' },
        { emoji: '🎯', message: 'Mira calibrada. Agora é só manter o foco e disparar' },
      ],
      gettingStarted: [
        { emoji: '🌱', message: 'Todo mundo começa de algum lugar. Pelo menos você começou!' },
        { emoji: '👣', message: 'Primeiro passo dado! Faltam... alguns. Mas vai dar bom' },
        { emoji: '🎬', message: 'Esse começo tá promissor. Agora não some, hein?' },
        { emoji: '🌟', message: 'O início é sempre o mais difícil. Você já passou dessa parte!' },
        { emoji: '🐣', message: 'Saiu da casca! Agora é hora de voar. Bom, primeiro andar' },
        { emoji: '🎮', message: 'Tutorial concluído! Agora começa o jogo de verdade' },
        { emoji: '🗝️', message: 'Desbloqueou a fase 1. Tem muita coisa boa pela frente' },
        { emoji: '🌅', message: 'Novo dia, novo começo. E dessa vez vai ser diferente, eu sinto' },
        { emoji: '🎒', message: 'Mochila nas costas e partiu jornada do conhecimento' },
        { emoji: '🏗️', message: 'A fundação tá sendo construída. Logo logo sobe o prédio' },
        { emoji: '🎵', message: 'Primeiras notas da sinfonia. Daqui a pouco vira orquestra' },
        { emoji: '🧪', message: 'Experiência em andamento. Hipótese: você vai mandar bem' },
        { emoji: '📖', message: 'Capítulo 1 começou. Spoiler: o protagonista vence no final' },
        { emoji: '🎲', message: 'Jogou os dados e tirou progresso! Agora rola de novo amanhã' },
        { emoji: '🌊', message: 'A primeira onda é a mais difícil de pegar. Já passou' },
        { emoji: '🚪', message: 'Abriu a porta dos estudos. Agora entra e não fecha, por favor' },
        { emoji: '🍳', message: 'Esquentando o motor! Logo logo tá em velocidade de cruzeiro' },
        { emoji: '🎯', message: 'Mira no alvo, dedo no gatilho. Agora é só disparar todo dia' },
        { emoji: '🧗', message: 'Primeira pegada na parede de escalada. O topo espera por você' },
        { emoji: '💫', message: 'Era isso que faltava: começar. O resto é consequência' },
      ],
      slacking: [
        { emoji: '👀', message: 'Ei, lembra de mim? Seus estudos sentem sua falta' },
        { emoji: '🤔', message: 'Você tava indo tão bem... O que aconteceu?' },
        { emoji: '😤', message: 'Cadê aquele foco? Tá guardado no bolso? Tira de lá!' },
        { emoji: '🛋️', message: 'O sofá é bom, mas o futuro é melhor. Bora estudar?' },
        { emoji: '📵', message: 'Larga o TikTok e vem cá. Eu sou mais legal, confia' },
        { emoji: '🦥', message: 'Modo preguiça ativado? Desativa isso aí, pelo amor' },
        { emoji: '🪫', message: 'Bateria de motivação em 5%. Vem carregar aqui nos estudos' },
        { emoji: '😴', message: 'Dormiu nos estudos literalmente. Bora acordar esse potencial?' },
        { emoji: '🫠', message: 'Derretendo no ócio? Para com isso, você é melhor que isso' },
        { emoji: '🐌', message: 'Até caracol tá mais rápido que seu progresso. Provocou? Provocou' },
        { emoji: '📺', message: 'Maratonando série tá bom, mas maratonar estudo é melhor pro futuro' },
        { emoji: '🧊', message: 'Esfriou o ritmo, mas dá pra reaquecer. Vem comigo' },
        { emoji: '👻', message: 'Sumiu como fantasma dos estudos. Faz um comeback digno' },
        { emoji: '🎭', message: 'O arco de redenção tá esperando. Só falta você começar' },
        { emoji: '🪃', message: 'Jogou os estudos longe, mas eles voltam. Tipo boomerang' },
        { emoji: '🎪', message: 'O circo pegou fogo e você tá assistindo de longe. Vem apagar' },
        { emoji: '🥊', message: 'Tá na hora do round 2. Levanta e volta pro ringue' },
        { emoji: '📉', message: 'Essa curva aqui tá descendente. Vamos inverter o gráfico?' },
        { emoji: '🫣', message: 'Tô com vergonha alheia do seu streak zerado. Vamos resolver isso?' },
        { emoji: '🔇', message: 'Silêncio ensurdecedor nos estudos. Bora fazer barulho de volta' },
      ],
      notStarted: [
        { emoji: '😶', message: 'Oi? Alguém aí? Esses estudos não vão se fazer sozinhos' },
        { emoji: '⏳', message: 'Tô aqui esperando... pacientemente... não tão pacientemente' },
        { emoji: '📢', message: 'Zero atividades? Vamos combinar que isso muda hoje' },
        { emoji: '🫣', message: 'Eu não julgo, mas... na verdade, julgo sim. Vamos estudar!' },
        { emoji: '💀', message: 'Progresso: inexistente. Assim não dá, né amigo' },
        { emoji: '🤡', message: 'Pagando de estudante sem estudar? Palhaçada. Literalmente' },
        { emoji: '🪦', message: 'RIP motivação. Mas calma, a gente faz um respawn' },
        { emoji: '🧸', message: 'Tá abraçando o travesseiro ou os livros? Escolhe o segundo' },
        { emoji: '📱', message: 'Scrollando feed infinito? Troca por progresso infinito aqui' },
        { emoji: '🚨', message: 'Alerta vermelho: zero atividades concluídas. Situação crítica' },
        { emoji: '🗑️', message: 'Jogou o planejamento no lixo? Bora reciclar essa atitude' },
        { emoji: '🎬', message: 'Se sua vida fosse filme, o público tava gritando "ESTUDA!"' },
        { emoji: '🫥', message: 'Barra de progresso vazia é a coisa mais triste que eu já vi' },
        { emoji: '🧟', message: 'Modo zumbi: vivo mas sem estudar. Acorda dessa aí' },
        { emoji: '🔕', message: 'Desativou as notificações dos estudos? Que feio. Volta aqui' },
        { emoji: '🎰', message: 'Tá apostando na sorte? Spoiler: o vestibular não aceita aposta' },
        { emoji: '🫧', message: 'Vivendo numa bolha sem estudos. Hora de estourar ela' },
        { emoji: '🛸', message: 'Abduzido por aliens? É a única desculpa aceitável pra zero progresso' },
        { emoji: '🧃', message: 'Tá de boa tomando suco enquanto o vestibular se aproxima? Vem cá' },
        { emoji: '🪞', message: 'Olha no espelho e fala: hoje eu estudo. Vai, eu espero' },
      ],
    }

    // Determinar tier baseado em performance
    let tier: keyof typeof pools
    if (stats.percentual === 100) {
      tier = 'completed'
    } else if (stats.percentual >= 80 && streakDays >= 7) {
      tier = 'legend'
    } else if (stats.percentual >= 60 || streakDays >= 5) {
      tier = 'onFire'
    } else if (stats.percentual >= 40 || streakDays >= 3) {
      tier = 'doingWell'
    } else if (stats.concluidas > 0 && streakDays > 0) {
      tier = 'gettingStarted'
    } else if (stats.concluidas > 0 && streakDays === 0) {
      tier = 'slacking'
    } else {
      tier = 'notStarted'
    }

    // Rotação diária: muda a mensagem a cada dia
    // Usando um valor estável baseado na data atual (calculado uma vez no cliente)
    const today = new Date()
    const dayIndex = Math.floor(today.getTime() / 86_400_000)
    const pool = pools[tier]
    const picked = pool[dayIndex % pool.length]

    return { ...picked, tier }
  }, [stats.percentual, stats.concluidas, streakDays])

  const effectiveDailyGoal = dailyGoal || { completed: 0, target: 3 }
  const dailyProgress = Math.min(
    100,
    Math.round((effectiveDailyGoal.completed / effectiveDailyGoal.target) * 100)
  )
  const dailyGoalComplete = effectiveDailyGoal.completed >= effectiveDailyGoal.target

  return (
    <Card className={cn('overflow-hidden rounded-2xl pt-0 dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5', className)}>
      <div className="h-0.5 bg-linear-to-r from-rose-400 to-pink-500" />
      <CardContent className="p-4 md:p-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-pink-500">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="widget-title">Progresso de Estudos</h3>
            <p className="text-xs text-muted-foreground">Visão geral do seu avanço</p>
          </div>
        </div>

        {/* Top Row: Streak + Daily Goal + Motivational Message */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          {/* Streak Badge */}
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl shrink-0',
              'bg-linear-to-r from-rose-500/15 via-pink-500/15 to-rose-500/15',
              'border border-rose-500/30'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                'bg-linear-to-br from-rose-500/20 via-pink-500/20 to-rose-500/20'
              )}
            >
              <Flame
                className={cn(
                  'h-4 w-4',
                  streakDays > 0
                    ? 'text-rose-500 animate-pulse'
                    : 'text-rose-400/60'
                )}
                fill="currentColor"
              />
            </div>
            <div className="flex flex-col">
              {isStreakLoading ? (
                <>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      'text-sm font-bold leading-tight',
                      streakDays > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500/70'
                    )}
                  >
                    {streakDays} {streakDays === 1 ? 'dia seguido' : 'dias seguidos'}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {streakMessage}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Daily Goal */}
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl shrink-0',
              dailyGoalComplete
                ? 'bg-pink-500/10 border border-pink-500/20'
                : 'bg-rose-500/5 border border-rose-500/10'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                dailyGoalComplete ? 'bg-pink-500/20' : 'bg-rose-500/10'
              )}
            >
              <Target
                className={cn(
                  'h-4 w-4',
                  dailyGoalComplete ? 'text-pink-500' : 'text-rose-500'
                )}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-sm font-bold leading-tight',
                  dailyGoalComplete ? 'text-pink-600 dark:text-pink-400' : 'text-foreground'
                )}
              >
                {effectiveDailyGoal.completed}/{effectiveDailyGoal.target} hoje
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {dailyGoalComplete ? 'Meta atingida!' : 'meta diária'}
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-[width] duration-500 motion-reduce:transition-none',
                  dailyGoalComplete ? 'bg-pink-500' : 'bg-rose-500'
                )}
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>

        </div>

        {/* Motivational Banner */}
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl mb-6',
            'bg-linear-to-r from-rose-500/10 via-pink-500/8 to-rose-500/10',
            'border border-rose-500/20'
          )}
        >
          <span className="text-xl shrink-0" role="img" aria-hidden>
            {motivationalContent.emoji}
          </span>
          <p className="text-sm font-medium text-foreground/90 leading-snug">
            {motivationalContent.message}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <div className="metric-value">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <div className="metric-value text-muted-foreground">
              {stats.pendentes}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Circle className="h-3 w-3" />
              Pendentes
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-rose-500/5">
            <div className="metric-value text-rose-600 dark:text-rose-400">
              {stats.iniciadas}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <PlayCircle className="h-3 w-3 text-rose-500" />
              Iniciadas
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-pink-500/5">
            <div className="metric-value text-pink-600 dark:text-pink-400">
              {stats.concluidas}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-pink-500" />
              Concluídas
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-semibold">{stats.percentual}%</span>
          </div>
          <Progress
            value={stats.percentual}
            className={cn(
              'h-2.5',
              stats.percentual === 100 ? '[&>div]:bg-pink-500' : '[&>div]:bg-rose-500'
            )}
          />
        </div>

      </CardContent>
    </Card>
  )
}
