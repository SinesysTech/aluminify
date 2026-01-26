import ExcelJS from 'exceljs';

export interface StudentTemplateColumn {
  header: string;
  key: string;
  width: number;
  required: boolean;
  example: string;
  description: string;
}

const TEMPLATE_COLUMNS: StudentTemplateColumn[] = [
  {
    header: 'Nome Completo',
    key: 'fullName',
    width: 30,
    required: true,
    example: 'João da Silva Santos',
    description: 'Nome completo do aluno (mín. 3, máx. 200 caracteres)',
  },
  {
    header: 'E-mail',
    key: 'email',
    width: 35,
    required: true,
    example: 'joao.silva@email.com',
    description: 'E-mail válido (será usado para login)',
  },
  {
    header: 'CPF',
    key: 'cpf',
    width: 15,
    required: true,
    example: '12345678900',
    description: 'CPF com 11 dígitos (apenas números)',
  },
  {
    header: 'Telefone',
    key: 'phone',
    width: 15,
    required: true,
    example: '11999998888',
    description: 'Telefone com DDD (10 ou 11 dígitos)',
  },
  {
    header: 'Número de Matrícula',
    key: 'enrollmentNumber',
    width: 20,
    required: true,
    example: 'MAT2025001',
    description: 'Código único de matrícula (máx. 50 caracteres)',
  },
  {
    header: 'Cursos',
    key: 'courses',
    width: 40,
    required: true,
    example: 'Curso de Matemática; Curso de Física',
    description: 'Nomes dos cursos separados por ponto e vírgula (;)',
  },
  {
    header: 'Senha Temporária',
    key: 'temporaryPassword',
    width: 20,
    required: true,
    example: 'Senha@123',
    description: 'Senha inicial (mín. 8 caracteres)',
  },
];

export class StudentTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aluminify';
    workbook.created = new Date();

    // Aba principal - Template de Importação
    const templateSheet = workbook.addWorksheet('Importação de Alunos', {
      properties: { tabColor: { argb: '09090B' } },
    });

    // Configurar colunas
    templateSheet.columns = TEMPLATE_COLUMNS.map((col) => ({
      header: col.required ? `${col.header} *` : col.header,
      key: col.key,
      width: col.width,
    }));

    // Estilizar cabeçalho
    const headerRow = templateSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '09090B' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Adicionar linha de exemplo
    const exampleData: Record<string, string> = {};
    TEMPLATE_COLUMNS.forEach((col) => {
      exampleData[col.key] = col.example;
    });
    templateSheet.addRow(exampleData);

    // Estilizar linha de exemplo
    const exampleRow = templateSheet.getRow(2);
    exampleRow.font = { italic: true, color: { argb: '6B7280' } };
    exampleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' },
    };

    // Adicionar comentários nas células do cabeçalho
    TEMPLATE_COLUMNS.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.note = {
        texts: [
          {
            font: { bold: true, size: 10, name: 'Arial' },
            text: `${col.header}\n`,
          },
          {
            font: { size: 9, name: 'Arial' },
            text: `${col.description}\n\n`,
          },
          {
            font: { italic: true, size: 9, name: 'Arial', color: { argb: '6B7280' } },
            text: `Exemplo: ${col.example}`,
          },
        ],
        margins: {
          insetmode: 'custom',
          inset: [0.25, 0.25, 0.35, 0.35],
        },
      };
    });

    // Adicionar bordas em todas as células
    templateSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle' };
        }
      });
    });

    // Congelar primeira linha
    templateSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Aba de instruções
    const instructionsSheet = workbook.addWorksheet('Instruções', {
      properties: { tabColor: { argb: '3B82F6' } },
    });

    instructionsSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Obrigatório', key: 'required', width: 15 },
      { header: 'Descrição', key: 'description', width: 50 },
      { header: 'Exemplo', key: 'example', width: 35 },
    ];

    // Estilizar cabeçalho das instruções
    const instructionsHeader = instructionsSheet.getRow(1);
    instructionsHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    instructionsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' },
    };
    instructionsHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    instructionsHeader.height = 25;

    // Adicionar dados das instruções
    TEMPLATE_COLUMNS.forEach((col) => {
      const row = instructionsSheet.addRow({
        field: col.header,
        required: col.required ? 'Sim' : 'Não',
        description: col.description,
        example: col.example,
      });
      row.alignment = { vertical: 'middle', wrapText: true };
    });

    // Adicionar bordas nas instruções
    instructionsSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        };
      });
    });

    // Adicionar notas importantes
    instructionsSheet.addRow([]);
    const notesStartRow = instructionsSheet.rowCount + 1;

    const notes = [
      '📋 INSTRUÇÕES DE PREENCHIMENTO:',
      '',
      '1. Preencha os dados na aba "Importação de Alunos"',
      '2. A linha 2 contém exemplos - pode ser removida ou substituída',
      '3. Campos marcados com * são obrigatórios',
      '4. O CPF deve conter apenas números (11 dígitos)',
      '5. O telefone deve conter apenas números com DDD (10 ou 11 dígitos)',
      '6. Para múltiplos cursos, separe-os com ponto e vírgula (;)',
      '7. Os nomes dos cursos devem corresponder exatamente aos cadastrados no sistema',
      '8. A senha temporária será usada no primeiro acesso do aluno',
      '9. Após o primeiro login, o aluno será obrigado a alterar a senha',
      '',
      '⚠️ IMPORTANTE:',
      '• E-mails duplicados serão ignorados',
      '• CPFs duplicados serão ignorados',
      '• Matrículas duplicadas serão ignoradas',
      '• Cursos não encontrados gerarão erro na linha',
    ];

    notes.forEach((note, index) => {
      const row = instructionsSheet.addRow([note]);
      row.getCell(1).font = {
        bold: index === 0 || index === 12,
        size: index === 0 || index === 12 ? 11 : 10,
      };
    });

    // Mesclar células das notas
    instructionsSheet.mergeCells(`A${notesStartRow}:D${notesStartRow}`);

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  getColumns(): StudentTemplateColumn[] {
    return TEMPLATE_COLUMNS;
  }
}
