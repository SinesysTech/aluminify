export interface ConteudosTemplateColumn {
  header: string;
  key: string;
  width: number;
  required: boolean;
  example: string;
  description: string;
}

// Modelo baseado no arquivo de referência "Frente A.xlsx"
const TEMPLATE_COLUMNS: ConteudosTemplateColumn[] = [
  {
    header: "Disciplina",
    key: "disciplina",
    width: 22,
    required: true,
    example: "Física",
    description: "Nome da disciplina (ex.: Física).",
  },
  {
    header: "Frente",
    key: "frente",
    width: 12,
    required: true,
    example: "A",
    description: "Nome/código da frente (ex.: A).",
  },
  {
    header: "Módulo",
    key: "modulo_numero",
    width: 10,
    required: true,
    example: "1",
    description: "Número do módulo (ex.: 1, 2, 3).",
  },
  {
    header: "Nome do Módulo",
    key: "modulo_nome",
    width: 28,
    required: true,
    example: "Vetores",
    description: "Nome do módulo (ex.: Vetores).",
  },
  {
    header: "Aula",
    key: "aula_numero",
    width: 10,
    required: true,
    example: "1",
    description: "Número da aula (ex.: 1, 2, 3).",
  },
  {
    header: "Nome da Aula",
    key: "aula_nome",
    width: 44,
    required: true,
    example: "Grandezas Escalares e Vetoriais",
    description: "Nome da aula.",
  },
  {
    header: "Tempo em minutos",
    key: "tempo_em_minutos",
    width: 18,
    required: false,
    example: "3",
    description:
      "Tempo em minutos. Pode ser número (ex.: 45) ou horário do Excel (mm:ss / hh:mm:ss).",
  },
  {
    header: "Prioridade",
    key: "prioridade",
    width: 14,
    required: false,
    example: "5",
    description: "Prioridade de 0 a 5 (5 = mais importante).",
  },
  {
    header: "Importância",
    key: "importancia",
    width: 14,
    required: false,
    example: "Alta",
    description: "Importância: Alta, Media, Baixa ou Base.",
  },
];

export class ConteudosTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Aluminify";
    workbook.created = new Date();

    const templateSheet = workbook.addWorksheet("Conteudos", {
      properties: { tabColor: { argb: "6B21A8" } }, // violet-800
    });

    // Observação: não usamos "*" no header para manter compatibilidade com modelos já testados.
    templateSheet.columns = TEMPLATE_COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Header style
    const headerRow = templateSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B21A8" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    // Linhas de exemplo (baseadas no arquivo de referência)
    const exemplos = [
      {
        disciplina: "Física",
        frente: "A",
        modulo_numero: "1",
        modulo_nome: "Vetores",
        aula_numero: "1",
        aula_nome: "Grandezas Escalares e Vetoriais",
        tempo_em_minutos: "3",
        prioridade: "5",
        importancia: "",
      },
      {
        disciplina: "Física",
        frente: "A",
        modulo_numero: "1",
        modulo_nome: "Vetores",
        aula_numero: "2",
        aula_nome: "Operações com Vetores",
        tempo_em_minutos: "5",
        prioridade: "4",
        importancia: "",
      },
    ];

    exemplos.forEach((exemplo) => {
      const row = templateSheet.addRow(exemplo);
      row.alignment = { vertical: "middle" };
    });

    // Data validations (Importância na coluna I)
    const dataValidations = (
      templateSheet as unknown as {
        dataValidations?: { add?: (range: string, validation: Record<string, unknown>) => void };
      }
    ).dataValidations;

    dataValidations?.add?.("I2:I1000", {
      type: "list",
      allowBlank: true,
      formulae: ['"Alta,Media,Baixa,Base"'],
      showErrorMessage: true,
      errorTitle: "Valor invalido",
      error: "Selecione: Alta, Media, Baixa ou Base",
    });

    // Prioridade na coluna H
    dataValidations?.add?.("H2:H1000", {
      type: "list",
      allowBlank: true,
      formulae: ['"0,1,2,3,4,5"'],
      showErrorMessage: true,
      errorTitle: "Valor invalido",
      error: "Selecione um valor de 0 a 5",
    });

    // Bordas
    for (let i = 1; i <= exemplos.length + 1; i++) {
      const row = templateSheet.getRow(i);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }

    templateSheet.views = [{ state: "frozen", ySplit: 1 }];

    // Aba de instruções
    const instructions = workbook.addWorksheet("Instrucoes", {
      properties: { tabColor: { argb: "3B82F6" } },
    });
    instructions.columns = [{ header: "Instrucoes de Preenchimento", key: "instrucao", width: 80 }];

    const headerInstr = instructions.getRow(1);
    headerInstr.font = { bold: true, size: 14 };
    headerInstr.height = 24;

    const textoInstrucoes = [
      "",
      "COMO PREENCHER A PLANILHA:",
      "",
      "COLUNAS (modelo baseado em Frente A.xlsx):",
      "1. Disciplina (obrigatorio): Nome da disciplina.",
      "2. Frente (obrigatorio): Nome/codigo da frente.",
      "3. Módulo (obrigatorio): Numero do modulo.",
      "4. Nome do Módulo (obrigatorio): Nome do modulo.",
      "5. Aula (obrigatorio): Numero da aula.",
      "6. Nome da Aula (obrigatorio): Nome da aula.",
      "7. Tempo em minutos (opcional): Numero de minutos OU horario do Excel (mm:ss / hh:mm:ss).",
      "8. Prioridade (opcional): Valor de 0 a 5.",
      "9. Importância (opcional): Alta, Media, Baixa ou Base.",
      "",
      "DICAS:",
      "- Use Módulo/Aula numéricos para ordenar corretamente.",
      "- A ordem das linhas também é respeitada em caso de empates.",
      "- Remova as linhas de exemplo antes de importar.",
    ];
    textoInstrucoes.forEach((t) => {
      instructions.addRow({ instrucao: t });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

