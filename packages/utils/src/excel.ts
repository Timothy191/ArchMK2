import * as XLSX from "xlsx";
import type { Fill, Font, Borders } from "exceljs";

type Primitive = string | number | boolean | Date | null | undefined;

export interface ExcelColumnConfig {
  key: string;
  header: string;
  width?: number;
  type?: "string" | "number" | "date" | "currency";
}

export interface ExcelSheetConfig {
  name: string;
  columns: ExcelColumnConfig[];
  data: Record<string, Primitive>[];
}

/**
 * Exports JSON data to a single-sheet Excel file (backward compatible)
 */
export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = "Sheet1",
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Exports multiple sheets to an Excel file using SheetJS (lightweight, no styling)
 */
export function exportMultiSheetExcel(
  sheets: ExcelSheetConfig[],
  fileName: string,
) {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const dataWithHeaders = [
      sheet.columns.map((c) => c.header),
      ...sheet.data.map((row) =>
        sheet.columns.map((col) => {
          const val = row[col.key];
          if (val instanceof Date) {
            return col.type === "date" ? val.toISOString() : val;
          }
          return val ?? "";
        }),
      ),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders);
    if (sheet.columns.some((c) => c.width)) {
      worksheet["!cols"] = sheet.columns.map((c) => ({
        wch: c.width ?? 12,
      }));
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Styled Excel export with formulas, cell formatting, and multiple sheets.
 * Uses dynamic import of exceljs to avoid bundling the heavy library on initial load.
 */
export async function exportStyledExcel(
  sheets: ExcelSheetConfig[],
  fileName: string,
  options?: {
    headerColor?: string;
    headerFontColor?: string;
    currencyFormat?: string;
    dateFormat?: string;
  },
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const headerFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: options?.headerColor?.replace("#", "") ?? "1F2937" },
  };
  const headerFont: Partial<Font> = {
    bold: true,
    color: { argb: options?.headerFontColor?.replace("#", "") ?? "FFFFFF" },
  };
  const borderStyle: Partial<Borders> = {
    top: { style: "thin", color: { argb: "D1D5DB" } },
    bottom: { style: "thin", color: { argb: "D1D5DB" } },
    left: { style: "thin", color: { argb: "D1D5DB" } },
    right: { style: "thin", color: { argb: "D1D5DB" } },
  };

  const currencyFmt = options?.currencyFormat ?? '"R"#,##0.00';
  const dateFmt = options?.dateFormat ?? "yyyy-mm-dd";

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    ws.columns = sheet.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 15,
    }));

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = borderStyle;
    });

    // Add data rows with type-aware formatting
    for (const row of sheet.data) {
      const dataRow = ws.addRow(
        sheet.columns.reduce(
          (acc, col) => {
            acc[col.key] = row[col.key];
            return acc;
          },
          {} as Record<string, Primitive>,
        ),
      );

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colConfig = sheet.columns[colNumber - 1];
        if (!colConfig) return;
        cell.border = borderStyle;

        if (colConfig.type === "currency") {
          cell.numFmt = currencyFmt;
        } else if (colConfig.type === "date") {
          cell.numFmt = dateFmt;
        }
      });
    }

    // Auto-filter on header row
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: ws.rowCount, column: sheet.columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses an Excel file and returns JSON data
 */
export async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName!];
        if (!worksheet) throw new Error("No worksheet found");
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
