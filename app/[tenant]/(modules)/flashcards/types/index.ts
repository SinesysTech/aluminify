export type Flashcard = {
  id: string;
  pergunta: string;
  resposta: string;
  perguntaImagemUrl?: string | null;
  respostaImagemUrl?: string | null;
  importancia?: string | null;
};

export type Curso = {
  id: string;
  nome: string;
};

export type Disciplina = {
  id: string;
  nome: string;
};

export type Frente = {
  id: string;
  nome: string;
  disciplina_id: string;
};

export type Modulo = {
  id: string;
  nome: string;
  numero_modulo: number | null;
  frente_id: string;
};

export const MODOS = [
  {
    id: "mais_cobrados",
    title: "🔥 Mais Cobrados",
    desc: "Foco no que mais cai nas provas",
    tooltip: [
      "Gera flashcards a partir dos conteúdos/tópicos com maior recorrência em provas.",
      "Ideal para priorizar estudo com maior retorno.",
    ],
  },
  {
    id: "conteudos_basicos",
    title: "📚 Conteúdos Básicos",
    desc: "Revisão do essencial",
    tooltip: [
      'Gera flashcards sortidos a partir de módulos marcados como "Base".',
      "Ideal para revisar fundamentos e pontos recorrentes da prova.",
    ],
  },
  {
    id: "revisao_geral",
    title: "🧠 Revisão Geral",
    desc: "Conteúdo misto",
    tooltip: [
      "Gera flashcards variados para uma revisão ampla.",
      "Bom para manter o conteúdo “em dia” e reforçar memória de longo prazo.",
    ],
  },
  {
    id: "mais_errados",
    title: "🚑 UTI dos Erros",
    desc: "Foco nas dificuldades",
    tooltip: [
      "Gera flashcards priorizando os pontos onde você costuma ter mais dificuldade (ex.: erros e baixo desempenho).",
      "Ideal para corrigir fraquezas.",
    ],
  },
  {
    id: "personalizado",
    title: "🎯 Personalizado",
    desc: "Escolha curso, frente e módulo",
    tooltip: [
      "Você escolhe exatamente o recorte (curso, disciplina, frente e módulo).",
      "Assim você revisa flashcards específicos daquele conteúdo.",
    ],
  },
];
