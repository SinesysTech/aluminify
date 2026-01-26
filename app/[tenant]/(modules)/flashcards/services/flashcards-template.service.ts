import ExcelJS from "exceljs";

export interface FlashcardsTemplateColumn {
  header: string;
  key: string;
  width: number;
  required: boolean;
  example: string;
  description: string;
}

const TEMPLATE_COLUMNS: FlashcardsTemplateColumn[] = [
  {
    header: "Módulo",
    key: "modulo",
    width: 14,
    required: true,
    example: "1",
    description:
      "Número do módulo (ex.: 1, 2, 3). Deve existir na frente selecionada no momento da importação.",
  },
  {
    header: "Pergunta",
    key: "pergunta",
    width: 50,
    required: true,
    example: "O que é a Segunda Lei de Newton?",
    description: "Texto da pergunta do flashcard.",
  },
  {
    header: "Resposta",
    key: "resposta",
    width: 60,
    required: true,
    example: "Força resultante é igual a massa vezes aceleração (F = m·a).",
    description: "Texto da resposta do flashcard.",
  },
];

export class FlashcardsTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Aluminify";
    workbook.created = new Date();

    // Aba principal - Template
    const templateSheet = workbook.addWorksheet("Importação de Flashcards", {
      properties: { tabColor: { argb: "09090B" } },
    });

    templateSheet.columns = TEMPLATE_COLUMNS.map((col) => ({
      header: col.required ? `${col.header} *` : col.header,
      key: col.key,
      width: col.width,
    }));

    // Header style
    const headerRow = templateSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "09090B" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Linha de exemplo
    const exampleData: Record<string, string> = {};
    TEMPLATE_COLUMNS.forEach((col) => {
      exampleData[col.key] = col.example;
    });
    templateSheet.addRow(exampleData);

    const exampleRow = templateSheet.getRow(2);
    exampleRow.font = { italic: true, color: { argb: "6B7280" } };
    exampleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F3F4F6" },
    };

    // Comentários no header
    TEMPLATE_COLUMNS.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.note = {
        texts: [
          { font: { bold: true, size: 10, name: "Arial" }, text: `${col.header}\n` },
          { font: { size: 9, name: "Arial" }, text: `${col.description}\n\n` },
          {
            font: { italic: true, size: 9, name: "Arial", color: { argb: "6B7280" } },
            text: `Exemplo: ${col.example}`,
          },
        ],
        margins: {
          insetmode: "custom",
          inset: [0.25, 0.25, 0.35, 0.35],
        },
      };
    });

    // Bordas e alinhamento
    templateSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E4E4E7" } },
          left: { style: "thin", color: { argb: "E4E4E7" } },
          bottom: { style: "thin", color: { argb: "E4E4E7" } },
          right: { style: "thin", color: { argb: "E4E4E7" } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: "middle", wrapText: true };
        }
      });
    });

    // Congelar primeira linha
    templateSheet.views = [{ state: "frozen", ySplit: 1 }];

    // Aba de instruções
    const instructionsSheet = workbook.addWorksheet("Instruções", {
      properties: { tabColor: { argb: "3B82F6" } },
    });

    instructionsSheet.columns = [
      { header: "Campo", key: "field", width: 22 },
      { header: "Obrigatório", key: "required", width: 14 },
      { header: "Descrição", key: "description", width: 62 },
      { header: "Exemplo", key: "example", width: 40 },
    ];

    const instructionsHeader = instructionsSheet.getRow(1);
    instructionsHeader.font = { bold: true, color: { argb: "FFFFFF" } };
    instructionsHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3B82F6" },
    };
    instructionsHeader.alignment = { vertical: "middle", horizontal: "center" };
    instructionsHeader.height = 25;

    TEMPLATE_COLUMNS.forEach((col) => {
      const row = instructionsSheet.addRow({
        field: col.header,
        required: col.required ? "Sim" : "Não",
        description: col.description,
        example: col.example,
      });
      row.alignment = { vertical: "middle", wrapText: true };
    });

    instructionsSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E4E4E7" } },
          left: { style: "thin", color: { argb: "E4E4E7" } },
          bottom: { style: "thin", color: { argb: "E4E4E7" } },
          right: { style: "thin", color: { argb: "E4E4E7" } },
        };
      });
    });

    instructionsSheet.addRow([]);
    const notesStartRow = instructionsSheet.rowCount + 1;
    const notes = [
      "📋 INSTRUÇÕES DE PREENCHIMENTO:",
      "",
      '1. Preencha os dados na aba "Importação de Flashcards".',
      "2. A linha 2 contém exemplos — pode ser removida ou substituída.",
      "3. Campos marcados com * são obrigatórios.",
      '4. No app, selecione Curso/curso/disciplinas/Frente antes de importar.',
      "5. A coluna Módulo deve ser o NÚMERO do módulo (conforme cadastrado na frente).",
      "",
      "⚠️ IMPORTANTE:",
      "• Imagens não são importadas via planilha (use o envio de imagem no editor, se necessário).",
      "• Linhas com módulo inválido ou campos vazios serão rejeitadas.",
    ];
    notes.forEach((note, index) => {
      const row = instructionsSheet.addRow([note]);
      row.getCell(1).font = {
        bold: index === 0 || index === 8,
        size: index === 0 || index === 8 ? 11 : 10,
      };
    });

    instructionsSheet.mergeCells(`A${notesStartRow}:D${notesStartRow}`);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

