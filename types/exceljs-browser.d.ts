declare module 'exceljs/dist/exceljs.min.js' {
  export interface ExcelJSCell {
    value: unknown
  }

  export interface ExcelJSRow {
    eachCell: (
      options: { includeEmpty?: boolean },
      callback: (cell: ExcelJSCell, colNumber: number) => void,
    ) => void
  }

  export interface ExcelJSWorksheet {
    eachRow: (callback: (row: ExcelJSRow, rowNumber: number) => void) => void
    worksheets?: never
  }

  export interface ExcelJSWorkbook {
    xlsx: { load: (data: ArrayBuffer) => Promise<void> }
    worksheets: ExcelJSWorksheet[]
  }

  export interface ExcelJSModule {
    Workbook: new () => ExcelJSWorkbook
  }

  const ExcelJS: ExcelJSModule
  export default ExcelJS
}
