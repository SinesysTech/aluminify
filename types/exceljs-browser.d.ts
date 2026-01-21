declare module "exceljs/dist/exceljs.min.js" {
  export interface ExcelJSCell {
    value: unknown;
    border?: {
      top?: { style: string; color: { argb: string } };
      left?: { style: string; color: { argb: string } };
      bottom?: { style: string; color: { argb: string } };
      right?: { style: string; color: { argb: string } };
    };
    alignment?: { horizontal?: string; vertical?: string };
    font?: { bold?: boolean; color?: { argb: string }; size?: number };
    fill?: { type: string; pattern: string; fgColor: { argb: string } };
  }

  export interface ExcelJSRow {
    eachCell: (
      options: { includeEmpty?: boolean },
      callback: (cell: ExcelJSCell, colNumber: number) => void,
    ) => void;
    alignment?: { horizontal?: string; vertical?: string };
    font?: { bold?: boolean; color?: { argb: string }; size?: number };
    fill?: { type: string; pattern: string; fgColor: { argb: string } };
    height?: number;
  }

  export interface ExcelJSColumn {
    header?: string;
    key?: string;
    width?: number;
  }

  export interface ExcelJSWorksheet {
    columns: Partial<ExcelJSColumn>[];
    eachRow: (callback: (row: ExcelJSRow, rowNumber: number) => void) => void;
    worksheets?: never;
    getRow(index: number): ExcelJSRow;
    addRow(data: Record<string, unknown> | unknown[]): ExcelJSRow;
    dataValidations: {
      add(range: string, validation: Record<string, unknown>): void;
    };
  }

  export interface ExcelJSWorkbook {
    creator: string;
    created: Date;
    xlsx: {
      load: (data: ArrayBuffer) => Promise<void>;
      writeBuffer: () => Promise<Uint8Array>;
    };
    worksheets: ExcelJSWorksheet[];
    addWorksheet(name: string, options?: unknown): ExcelJSWorksheet;
  }

  export interface ExcelJSModule {
    Workbook: new () => ExcelJSWorkbook;
  }

  const ExcelJS: ExcelJSModule;
  export default ExcelJS;
}
