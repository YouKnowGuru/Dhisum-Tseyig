import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  TrialBalanceItem,
  ProfitLossData,
  BalanceSheetData,
  OutstandingItem,
  StockReportItem,
  Transaction,
  Contact,
  Item,
  Expense,
  Refund,
  PurchaseOrder,
  Quotation,
  AgedReport,
} from '../types';

// ─── Excel Styling Constants ──────────────────────────────────────────────────
const EXCEL_STYLES = {
  // Bhutanese colors
  crimson: { fg: { rgb: '9B2335' }, bg: { fg: { rgb: '9B2335' } } },
  crimsonDark: { fg: { rgb: '781928' }, bg: { fg: { rgb: '781928' } } },
  saffron: { fg: { rgb: 'E8A020' }, bg: { fg: { rgb: 'E8A020' } } },
  gold: { fg: { rgb: 'C49A25' }, bg: { fg: { rgb: 'C49A25' } } },
  slate: { fg: { rgb: '1E2B3C' }, bg: { fg: { rgb: '1E2B3C' } } },
  navy: { fg: { rgb: '0F1C2D' }, bg: { fg: { rgb: '0F1C2D' } } },
  cream: { fg: { rgb: 'FDF8F0' }, bg: { fg: { rgb: 'FDF8F0' } } },
  ash: { fg: { rgb: 'F4EFE6' }, bg: { fg: { rgb: 'F4EFE6' } } },
  grey: { fg: { rgb: '64748B' }, bg: { fg: { rgb: '64748B' } } },
  white: { fg: { rgb: 'FFFFFF' }, bg: { fg: { rgb: 'FFFFFF' } } },
  black: { fg: { rgb: '1E2B3C' }, bg: { fg: { rgb: '1E2B3C' } } },
  // Accent colors
  emerald: { fg: { rgb: '059669' }, bg: { fg: { rgb: 'D1FAE5' } } },
  red: { fg: { rgb: 'DC2626' }, bg: { fg: { rgb: 'FEE2E2' } } },
  blue: { fg: { rgb: '2563EB' }, bg: { fg: { rgb: 'DBEAFE' } } },
  purple: { fg: { rgb: '9333EA' }, bg: { fg: { rgb: 'F3E8FF' } } },
};

// ─── Cell style presets ───────────────────────────────────────────────────────
const _CELL_STYLES = {
  title: {
    font: { bold: true, size: 18, color: EXCEL_STYLES.white.fg },
    fill: { fgColor: EXCEL_STYLES.crimson.bg.fg },
    alignment: { horizontal: 'left', vertical: 'middle' },
  },
  subtitle: {
    font: { bold: false, size: 10, color: EXCEL_STYLES.grey.fg },
    alignment: { horizontal: 'left', vertical: 'middle' },
  },
  header: {
    font: { bold: true, size: 10, color: EXCEL_STYLES.white.fg },
    fill: { fgColor: EXCEL_STYLES.crimson.bg.fg },
    border: {
      top: { style: 'thin', color: EXCEL_STYLES.crimsonDark.fg },
      bottom: { style: 'medium', color: EXCEL_STYLES.saffron.bg.fg },
    },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  },
  headerRight: {
    font: { bold: true, size: 10, color: EXCEL_STYLES.white.fg },
    fill: { fgColor: EXCEL_STYLES.crimson.bg.fg },
    border: {
      top: { style: 'thin', color: EXCEL_STYLES.crimsonDark.fg },
      bottom: { style: 'medium', color: EXCEL_STYLES.saffron.bg.fg },
    },
    alignment: { horizontal: 'right', vertical: 'middle', wrapText: true },
  },
  row: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    alignment: { vertical: 'middle' },
  },
  rowRight: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  rowAlternate: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    fill: { fgColor: EXCEL_STYLES.cream.bg.fg },
    alignment: { vertical: 'middle' },
  },
  rowAlternateRight: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    fill: { fgColor: EXCEL_STYLES.cream.bg.fg },
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  totalRow: {
    font: { bold: true, size: 11, color: EXCEL_STYLES.white.fg },
    fill: { fgColor: EXCEL_STYLES.navy.bg.fg },
    border: {
      top: { style: 'medium', color: EXCEL_STYLES.saffron.bg.fg },
    },
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  totalLabel: {
    font: { bold: true, size: 10, color: EXCEL_STYLES.white.fg },
    fill: { fgColor: EXCEL_STYLES.navy.bg.fg },
    border: {
      top: { style: 'medium', color: EXCEL_STYLES.saffron.bg.fg },
    },
    alignment: { horizontal: 'left', vertical: 'middle' },
  },
  currency: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  currencyAlt: {
    font: { size: 10, color: EXCEL_STYLES.slate.fg },
    numFmt: '#,##0.00',
    fill: { fgColor: EXCEL_STYLES.cream.bg.fg },
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  currencyTotal: {
    font: { bold: true, size: 11, color: EXCEL_STYLES.white.fg },
    numFmt: '#,##0.00',
    fill: { fgColor: EXCEL_STYLES.navy.bg.fg },
    border: {
      top: { style: 'medium', color: EXCEL_STYLES.saffron.bg.fg },
    },
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  positive: {
    font: { size: 10, color: EXCEL_STYLES.emerald.fg },
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  negative: {
    font: { size: 10, color: EXCEL_STYLES.red.fg },
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right', vertical: 'middle' },
  },
  sectionHeader: {
    font: { bold: true, size: 11, color: EXCEL_STYLES.crimson.fg },
    fill: { fgColor: EXCEL_STYLES.ash.bg.fg },
    alignment: { horizontal: 'left', vertical: 'middle' },
  },
};

// ─── Bhutanese Palette (matching PrintingService) ─────────────────────────────
const C = {
  crimson: [155, 35, 53] as [number, number, number],    // #9B2335
  crimsonDark: [120, 25, 40] as [number, number, number],
  saffron: [232, 160, 32] as [number, number, number],    // #E8A020
  gold: [196, 154, 37] as [number, number, number],       // #C49A25
  slate: [30, 43, 60] as [number, number, number],        // #1E2B3C
  navy: [15, 28, 45] as [number, number, number],         // #0F1C2D
  cream: [253, 248, 240] as [number, number, number],     // #FDF8F0
  ash: [244, 239, 230] as [number, number, number],       // #F4EFE6
  grey: [100, 116, 139] as [number, number, number],      // #64748B
  white: [255, 255, 255] as [number, number, number],
  black: [30, 43, 60] as [number, number, number],
};

// ─── Prayer flag colors for the top bar ───────────────────────────────────────
const FLAG_COLORS: [number, number, number][] = [
  [58, 123, 213],   // Blue
  [255, 255, 255],  // White
  [232, 160, 32],   // Saffron/Yellow
  [46, 184, 92],    // Green
  [229, 57, 53],    // Red
];

/**
 * Draw the Bhutanese prayer-flag color bar across the top of a PDF page.
 */
function drawFlagBar(doc: jsPDF, y: number, width: number): void {
  const segmentWidth = width / FLAG_COLORS.length;
  FLAG_COLORS.forEach((color, i) => {
    doc.setFillColor(...color);
    doc.rect(i * segmentWidth, y, segmentWidth, 4, 'F');
  });
}

/**
 * Draw a styled page header with branding.
 */
function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  pageWidth: number
): number {
  // Prayer flag bar at very top
  drawFlagBar(doc, 0, pageWidth);

  // Crimson header band
  doc.setFillColor(...C.crimson);
  doc.rect(0, 4, pageWidth, 32, 'F');

  // Gold accent line
  doc.setFillColor(...C.saffron);
  doc.rect(0, 36, pageWidth, 2, 'F');

  // Business name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text('Jinda POS', 14, 16);

  // Report title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 28);

  // Subtitle / date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(subtitle, 14, 34);

  // Right-aligned generation timestamp
  doc.setTextColor(...C.white);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth - 14, 34, { align: 'right' });

  return 44; // startY for content
}

/**
 * Draw page footer with page numbers and branding.
 */
function _drawFooter(doc: jsPDF, pageCount: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom bar
    doc.setFillColor(...C.crimson);
    doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');

    // Gold accent line
    doc.setFillColor(...C.saffron);
    doc.rect(0, pageHeight - 16, pageWidth, 1, 'F');

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Jinda POS — Accounting & POS System for Bhutan', 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    doc.text('Powered by Phojaa95', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

/**
 * Format a number as Bhutanese Ngultrum (Nu.)
 */
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return `Nu. ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Apply a style to a cell range in a worksheet
 */
function _applyCellStyle(
  ws: XLSX.WorkSheet,
  cellRef: string,
  style: any
): void {
  if (!ws[cellRef]) {
    ws[cellRef] = { t: 's', v: '' };
  }
  ws[cellRef].s = style;
}

/**
 * Create a styled header row
 */
function createStyledHeader(
  ws: XLSX.WorkSheet,
  row: number,
  headers: string[],
  colStart: number = 0
): void {
  headers.forEach((header, i) => {
    const col = XLSX.utils.encode_col(colStart + i);
    const cellRef = `${col}${row}`;
    ws[cellRef] = {
      t: 's',
      v: header,
      s: {
        font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '9B2335' } },
        border: {
          top: { style: 'thin', color: { rgb: '781928' } },
          bottom: { style: 'medium', color: { rgb: 'E8A020' } },
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      },
    };
  });
}

/**
 * Create a styled data row
 */
function createStyledRow(
  ws: XLSX.WorkSheet,
  row: number,
  values: any[],
  colStart: number = 0,
  isAlternate: boolean = false,
  formatAsCurrency: boolean[] = []
): void {
  values.forEach((value, i) => {
    const col = XLSX.utils.encode_col(colStart + i);
    const cellRef = `${col}${row}`;
    const isCurrency = formatAsCurrency[i];
    const isRightAligned = isCurrency || typeof value === 'number';

    ws[cellRef] = {
      t: isCurrency ? 'n' : 's',
      v: value,
      s: {
        font: { size: 10, color: { rgb: '1E2B3C' } },
        fill: isAlternate ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
        alignment: {
          horizontal: isRightAligned ? 'right' : 'left',
          vertical: 'middle',
        },
        numFmt: isCurrency ? '#,##0.00' : undefined,
      },
    };
  });
}

/**
 * Create a styled total row
 */
function createTotalRow(
  ws: XLSX.WorkSheet,
  row: number,
  label: string,
  values: any[],
  colStart: number = 0,
  formatAsCurrency: boolean[] = []
): void {
  // Label cell
  const labelCol = XLSX.utils.encode_col(colStart);
  const labelRef = `${labelCol}${row}`;
  ws[labelRef] = {
    t: 's',
    v: label,
    s: {
      font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0F1C2D' } },
      border: {
        top: { style: 'medium', color: { rgb: 'E8A020' } },
      },
      alignment: { horizontal: 'left', vertical: 'middle' },
    },
  };

  // Value cells
  values.forEach((value, i) => {
    const col = XLSX.utils.encode_col(colStart + 1 + i);
    const cellRef = `${col}${row}`;
    const isCurrency = formatAsCurrency[i];

    ws[cellRef] = {
      t: isCurrency ? 'n' : 's',
      v: value,
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F1C2D' } },
        border: {
          top: { style: 'medium', color: { rgb: 'E8A020' } },
        },
        alignment: {
          horizontal: isCurrency ? 'right' : 'left',
          vertical: 'middle',
        },
        numFmt: isCurrency ? '#,##0.00' : undefined,
      },
    };
  });
}

/**
 * Create a styled worksheet with Bhutanese theme
 */
function createStyledWorksheet(
  title: string,
  subtitle: string,
  headers: string[],
  rows: any[][],
  options: {
    colWidths?: number[];
    formatCurrency?: boolean[];
    totalRow?: { label: string; values: any[] };
  } = {}
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  // Set column widths
  if (options.colWidths) {
    ws['!cols'] = options.colWidths.map(w => ({ wch: w }));
  }

  // Title row (row 1)
  const titleRef = `A1`;
  ws[titleRef] = {
    t: 's',
    v: title,
    s: {
      font: { bold: true, size: 18, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '9B2335' } },
      alignment: { horizontal: 'left', vertical: 'middle' },
    },
  };

  // Merge title across columns
  ws['!merges'] = [{
    s: { r: 0, c: 0 },
    e: { r: 0, c: headers.length - 1 },
  }];

  // Subtitle row (row 2)
  const subtitleRef = `A2`;
  ws[subtitleRef] = {
    t: 's',
    v: subtitle,
    s: {
      font: { size: 10, color: { rgb: '64748B' } },
      alignment: { horizontal: 'left', vertical: 'middle' },
    },
  };

  // Empty row (row 3)
  // Header row (row 4)
  createStyledHeader(ws, 4, headers);

  // Data rows (starting at row 5)
  rows.forEach((row, i) => {
    createStyledRow(ws, 5 + i, row, 0, i % 2 === 1, options.formatCurrency);
  });

  // Total row if provided
  if (options.totalRow) {
    const totalRowNum = 5 + rows.length;
    createTotalRow(ws, totalRowNum, options.totalRow.label, options.totalRow.values, 0, options.formatCurrency);
  }

  // Set sheet range
  const lastRow = options.totalRow ? 5 + rows.length : 4 + rows.length;
  ws['!ref'] = `A1:${XLSX.utils.encode_col(headers.length - 1)}${lastRow}`;

  return ws;
}


export class ExportService {
  /**
   * Export Trial Balance to Excel
   */
  exportTrialBalance(data: TrialBalanceItem[], asOfDate: string): void {
    const totalDebit = data.reduce((s, i) => s + i.debit, 0);
    const totalCredit = data.reduce((s, i) => s + i.credit, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — TRIAL BALANCE',
      `As of ${asOfDate}`,
      ['Code', 'Account Name', 'Debit (Nu.)', 'Credit (Nu.)'],
      data.map(item => [item.code, item.name, item.debit, item.credit]),
      {
        colWidths: [12, 40, 18, 18],
        formatCurrency: [false, false, true, true],
        totalRow: {
          label: 'TOTAL',
          values: [totalDebit, totalCredit],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
    XLSX.writeFile(wb, `Trial_Balance_${asOfDate}.xlsx`);
  }

  /**
   * Export Profit & Loss to Excel
   */
  exportProfitLoss(data: ProfitLossData): void {
    const ws: XLSX.WorkSheet = {};
    ws['!cols'] = [{ wch: 40 }, { wch: 5 }, { wch: 18 }];

    // Title
    ws['A1'] = {
      t: 's',
      v: 'JINDA POS — PROFIT & LOSS STATEMENT',
      s: {
        font: { bold: true, size: 18, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '9B2335' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    // Revenue section header
    ws['A3'] = {
      t: 's',
      v: 'REVENUE & INCOME',
      s: {
        font: { bold: true, size: 11, color: { rgb: '059669' } },
        fill: { fgColor: { rgb: 'D1FAE5' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C3'] = { t: 's', v: '', s: { fill: { fgColor: { rgb: 'D1FAE5' } } } };

    // Revenue items
    const revenueItems = [
      { label: 'Product Sales', value: data.revenue.sales },
      { label: 'Other Income', value: data.revenue.otherIncome },
    ];
    revenueItems.forEach((item, i) => {
      const row = 4 + i;
      ws[`A${row}`] = {
        t: 's',
        v: item.label,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.value,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
    });

    // Total Revenue
    ws['A6'] = {
      t: 's',
      v: 'TOTAL REVENUE',
      s: {
        font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C6'] = {
      t: 'n',
      v: data.revenue.total,
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };

    // Expenses section header
    ws['A8'] = {
      t: 's',
      v: 'OPERATIONAL EXPENDITURES',
      s: {
        font: { bold: true, size: 11, color: { rgb: 'DC2626' } },
        fill: { fgColor: { rgb: 'FEE2E2' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C8'] = { t: 's', v: '', s: { fill: { fgColor: { rgb: 'FEE2E2' } } } };

    // Expense items
    const expenseItems = [
      { label: 'Cost of Goods Sold', value: data.expenses.cogs },
      { label: 'Operating Expenses', value: data.expenses.operating },
      { label: 'Other Expenses', value: data.expenses.other },
    ];
    expenseItems.forEach((item, i) => {
      const row = 9 + i;
      ws[`A${row}`] = {
        t: 's',
        v: item.label,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.value,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
    });

    // Total Expenses
    ws['A12'] = {
      t: 's',
      v: 'TOTAL EXPENSES',
      s: {
        font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'DC2626' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C12'] = {
      t: 'n',
      v: data.expenses.total,
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'DC2626' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };

    // Gross Profit
    ws['A14'] = {
      t: 's',
      v: 'GROSS PROFIT',
      s: {
        font: { bold: true, size: 11, color: { rgb: '1E2B3C' } },
        fill: { fgColor: { rgb: 'F4EFE6' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C14'] = {
      t: 'n',
      v: data.grossProfit,
      s: {
        font: { bold: true, size: 11, color: { rgb: '1E2B3C' } },
        fill: { fgColor: { rgb: 'F4EFE6' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };

    // Net Profit
    ws['A16'] = {
      t: 's',
      v: 'NET PROFIT',
      s: {
        font: { bold: true, size: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F1C2D' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['C16'] = {
      t: 'n',
      v: data.netProfit,
      s: {
        font: { bold: true, size: 14, color: { rgb: 'FFD700' } },
        fill: { fgColor: { rgb: '0F1C2D' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };

    ws['!ref'] = 'A1:C16';

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss');
    XLSX.writeFile(wb, 'Profit_Loss_Statement.xlsx');
  }

  /**
   * Export Balance Sheet to Excel
   */
  exportBalanceSheet(data: BalanceSheetData): void {
    const ws: XLSX.WorkSheet = {};
    ws['!cols'] = [{ wch: 40 }, { wch: 5 }, { wch: 18 }];

    // Title
    ws['A1'] = {
      t: 's',
      v: 'JINDA POS — BALANCE SHEET',
      s: {
        font: { bold: true, size: 18, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '9B2335' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    let row = 3;

    // Assets section
    ws[`A${row}`] = {
      t: 's',
      v: 'CORPORATE ASSETS',
      s: {
        font: { bold: true, size: 11, color: { rgb: '059669' } },
        fill: { fgColor: { rgb: 'D1FAE5' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = { t: 's', v: '', s: { fill: { fgColor: { rgb: 'D1FAE5' } } } };
    row++;

    // Current Assets header
    ws[`A${row}`] = {
      t: 's',
      v: 'Current Assets',
      s: { font: { bold: true, size: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left' } },
    };
    row++;

    // Current Assets items
    data.assets.current.forEach((item, _i) => {
      ws[`A${row}`] = {
        t: 's',
        v: '  ' + item.name,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.balance,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
      row++;
    });

    // Fixed Assets header
    ws[`A${row}`] = {
      t: 's',
      v: 'Fixed Assets',
      s: { font: { bold: true, size: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left' } },
    };
    row++;

    // Fixed Assets items
    data.assets.fixed.forEach((item, _i) => {
      ws[`A${row}`] = {
        t: 's',
        v: '  ' + item.name,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.balance,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
      row++;
    });

    // Total Assets
    ws[`A${row}`] = {
      t: 's',
      v: 'TOTAL ASSETS',
      s: {
        font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = {
      t: 'n',
      v: data.assets.total,
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };
    row += 2;

    // Liabilities section
    ws[`A${row}`] = {
      t: 's',
      v: 'LIABILITIES & CAPITAL',
      s: {
        font: { bold: true, size: 11, color: { rgb: '800000' } },
        fill: { fgColor: { rgb: 'FEE2E2' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = { t: 's', v: '', s: { fill: { fgColor: { rgb: 'FEE2E2' } } } };
    row++;

    // Current Liabilities header
    ws[`A${row}`] = {
      t: 's',
      v: 'Current Liabilities',
      s: { font: { bold: true, size: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left' } },
    };
    row++;

    // Current Liabilities items
    data.liabilities.current.forEach((item, _i) => {
      ws[`A${row}`] = {
        t: 's',
        v: '  ' + item.name,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.balance,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
      row++;
    });

    // Long-term Liabilities header
    ws[`A${row}`] = {
      t: 's',
      v: 'Long-term Liabilities',
      s: { font: { bold: true, size: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'left' } },
    };
    row++;

    // Long-term Liabilities items
    data.liabilities.longTerm.forEach((item, _i) => {
      ws[`A${row}`] = {
        t: 's',
        v: '  ' + item.name,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.balance,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
      row++;
    });

    // Total Liabilities
    ws[`A${row}`] = {
      t: 's',
      v: 'TOTAL LIABILITIES',
      s: {
        font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '800000' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = {
      t: 'n',
      v: data.liabilities.total,
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '800000' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };
    row += 2;

    // Equity section
    ws[`A${row}`] = {
      t: 's',
      v: 'EQUITY / CAPITAL',
      s: {
        font: { bold: true, size: 11, color: { rgb: '9333EA' } },
        fill: { fgColor: { rgb: 'F3E8FF' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = { t: 's', v: '', s: { fill: { fgColor: { rgb: 'F3E8FF' } } } };
    row++;

    // Equity items
    data.equity.forEach((item, _i) => {
      ws[`A${row}`] = {
        t: 's',
        v: '  ' + item.name,
        s: { font: { size: 10, color: { rgb: '1E2B3C' } }, alignment: { vertical: 'middle' } },
      };
      ws[`C${row}`] = {
        t: 'n',
        v: item.balance,
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };
      row++;
    });

    // Total Equity + Liabilities
    ws[`A${row}`] = {
      t: 's',
      v: 'TOTAL EQUITY + LIABILITIES',
      s: {
        font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F1C2D' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws[`C${row}`] = {
      t: 'n',
      v: data.totalEquity,
      s: {
        font: { bold: true, size: 14, color: { rgb: 'FFD700' } },
        fill: { fgColor: { rgb: '0F1C2D' } },
        numFmt: '#,##0.00',
        alignment: { horizontal: 'right', vertical: 'middle' },
      },
    };

    ws['!ref'] = `A1:C${row}`;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
    XLSX.writeFile(wb, 'Balance_Sheet.xlsx');
  }

  /**
   * Export Outstanding Report to Excel
   */
  exportOutstanding(data: OutstandingItem[]): void {
    const totalOutstanding = data.reduce((s, i) => s + i.totalDue, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — OUTSTANDING REPORT',
      'Money to collect from trade partners',
      ['Name', 'Type', 'Current Balance (Nu.)', 'Total Due (Nu.)', 'Days Overdue'],
      data.map(item => [item.name, item.type, item.currentBalance, item.totalDue, item.daysOverdue]),
      {
        colWidths: [30, 12, 20, 18, 14],
        formatCurrency: [false, false, true, true, false],
        totalRow: {
          label: 'TOTAL OUTSTANDING',
          values: ['', '', totalOutstanding, ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding');
    XLSX.writeFile(wb, 'Outstanding_Report.xlsx');
  }

  /**
   * Export Stock Report to Excel
   */
  exportStockReport(data: StockReportItem[]): void {
    const totalValue = data.reduce((s, i) => s + i.stockValue, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — STOCK REPORT',
      'Inventory valuation and stock levels',
      ['Item Name', 'Category', 'Stock', 'Value (Nu.)', 'Reorder Level', 'Status'],
      data.map(item => [item.name, item.category || '', item.quantityInStock, item.stockValue, item.reorderLevel, item.stockStatus]),
      {
        colWidths: [35, 22, 12, 18, 14, 14],
        formatCurrency: [false, false, false, true, false, false],
        totalRow: {
          label: 'TOTAL INVENTORY VALUE',
          values: ['', '', '', totalValue, '', ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    XLSX.writeFile(wb, 'Stock_Report.xlsx');
  }

  /**
   * Export Sales Report to Excel
   */
  exportSalesReport(sales: Transaction[], summary: any): void {
    const totalRevenue = summary.totalRevenue || summary.total_sales || 0;
    const totalGst = summary.totalGst || 0;
    const totalTransactions = summary.totalTransactions || summary.total_transactions || 0;

    const ws: XLSX.WorkSheet = {};
    ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];

    // Title
    ws['A1'] = {
      t: 's',
      v: 'JINDA POS — SALES REPORT',
      s: {
        font: { bold: true, size: 18, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '9B2335' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    // Summary cards
    const summaryCards = [
      { label: 'Total Revenue', value: totalRevenue, color: '0F1C2D' },
      { label: 'GST Collected', value: totalGst, color: '9333EA' },
      { label: 'Transactions', value: totalTransactions, color: '2563EB', isNumber: true },
    ];

    summaryCards.forEach((card, i) => {
      const col = i * 2 + 1;
      ws[XLSX.utils.encode_col(col) + '3'] = {
        t: 's',
        v: card.label.toUpperCase(),
        s: {
          font: { bold: true, size: 8, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: card.color } },
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
      };
      ws[XLSX.utils.encode_col(col) + '4'] = {
        t: card.isNumber ? 'n' : 'n',
        v: card.value,
        s: {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: card.color } },
          numFmt: card.isNumber ? '#,##0' : '#,##0.00',
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
      };
    });

    // Header row
    const headers = ['Invoice', 'Date', 'Type', 'Customer', 'Amount (Nu.)', 'Payment Mode', 'Status'];
    createStyledHeader(ws, 6, headers);

    // Data rows
    sales.forEach((item, i) => {
      const row = 7 + i;
      const isAlt = i % 2 === 1;

      ws[`A${row}`] = {
        t: 's',
        v: `#${item.transactionNo}`,
        s: {
          font: { bold: true, size: 10, color: { rgb: '1E2B3C' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'left', vertical: 'middle' },
        },
      };
      ws[`B${row}`] = {
        t: 's',
        v: item.date,
        s: {
          font: { size: 10, color: { rgb: '64748B' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'left', vertical: 'middle' },
        },
      };
      ws[`C${row}`] = {
        t: 's',
        v: item.type,
        s: {
          font: { size: 10, color: { rgb: '64748B' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'left', vertical: 'middle' },
        },
      };
      ws[`D${row}`] = {
        t: 's',
        v: item.contactName || 'Walk-in Customer',
        s: {
          font: { size: 10, color: { rgb: '1E2B3C' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'left', vertical: 'middle' },
        },
      };
      ws[`E${row}`] = {
        t: 'n',
        v: item.netAmount,
        s: {
          font: { bold: true, size: 10, color: { rgb: '1E2B3C' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          numFmt: '#,##0.00',
          alignment: { horizontal: 'right', vertical: 'middle' },
        },
      };

      // Payment mode with color coding
      const paymentColors: Record<string, string> = {
        cash: '059669',
        credit: '2563EB',
        bank: '9333EA',
      };
      const paymentColor = paymentColors[item.paymentMode || ''] || '64748B';

      ws[`F${row}`] = {
        t: 's',
        v: (item.paymentMode || 'cash').toUpperCase(),
        s: {
          font: { bold: true, size: 9, color: { rgb: paymentColor } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
      };
      ws[`G${row}`] = {
        t: 's',
        v: item.status,
        s: {
          font: { size: 10, color: { rgb: '64748B' } },
          fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
      };
    });

    // Total row
    const totalRow = 7 + sales.length;
    createTotalRow(ws, totalRow, 'TOTAL SALES', [totalRevenue], 4, [true]);

    ws['!ref'] = `A1:G${totalRow}`;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    XLSX.writeFile(wb, `Sales_Report.xlsx`);
  }

  /**
   * Export any data to Excel with optional column widths
   */
  exportToExcel(data: any[][], filename: string, colWidths?: { wch: number }[]): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    if (colWidths) {
      ws['!cols'] = colWidths;
    }

    // Apply basic styling to header row
    if (data.length > 0) {
      const headerRow = data[0];
      headerRow.forEach((_, i) => {
        const col = XLSX.utils.encode_col(i);
        const cellRef = `${col}1`;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, size: 10, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '9B2335' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
          };
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Transactions to Excel
   */
  exportTransactions(transactions: Transaction[], filename: string = 'Transactions'): void {
    const totalAmount = transactions.reduce((s, t) => s + t.netAmount, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — TRANSACTION REGISTER',
      `${transactions.length} transactions recorded`,
      ['#', 'Date', 'Type', 'Contact', 'Amount (Nu.)', 'Payment', 'Status'],
      transactions.map(t => [t.transactionNo, t.date, t.type, t.contactName || '-', t.netAmount, t.paymentMode || '', t.status]),
      {
        colWidths: [16, 14, 14, 28, 18, 14, 14],
        formatCurrency: [false, false, false, false, true, false, false],
        totalRow: {
          label: 'TOTAL',
          values: ['', '', '', totalAmount, '', ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Contacts to Excel
   */
  exportContacts(contacts: Contact[], filename: string = 'Contacts'): void {
    const totalBalance = contacts.reduce((s, c) => s + c.currentBalance, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — CONTACTS DIRECTORY',
      `${contacts.length} contacts in directory`,
      ['Name', 'Type', 'Phone', 'Email', 'Credit Limit (Nu.)', 'Balance (Nu.)', 'GST/TPN/CID'],
      contacts.map(c => [c.name, c.type, c.phone || '', c.email || '', c.creditLimit, c.currentBalance, c.gstNumber || '']),
      {
        colWidths: [28, 12, 18, 28, 18, 18, 20],
        formatCurrency: [false, false, false, false, true, true, false],
        totalRow: {
          label: 'TOTAL BALANCE',
          values: ['', '', '', '', totalBalance, ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Items to Excel
   */
  exportItems(items: Item[], filename: string = 'Items'): void {
    const totalValue = items.reduce((s, i) => s + (i.sellingPrice * i.quantityInStock), 0);

    const ws = createStyledWorksheet(
      'JINDA POS — INVENTORY REGISTER',
      `${items.length} items in inventory`,
      ['Code', 'Name', 'Category', 'Purchase Price (Nu.)', 'Selling Price (Nu.)', 'Stock', 'Reorder Level'],
      items.map(i => [i.code, i.name, i.category || '', i.purchasePrice, i.sellingPrice, i.quantityInStock, i.reorderLevel]),
      {
        colWidths: [14, 35, 22, 18, 18, 12, 14],
        formatCurrency: [false, false, false, true, true, false, false],
        totalRow: {
          label: 'TOTAL INVENTORY VALUE',
          values: ['', '', '', '', totalValue, '', ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Expenses to Excel
   */
  exportExpenses(expenses: Expense[], filename: string = 'Expenses'): void {
    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — EXPENSE REGISTER',
      `${expenses.length} expenses recorded`,
      ['#', 'Date', 'Category', 'Amount (Nu.)', 'Payment Mode', 'Vendor', 'Description'],
      expenses.map(e => [e.expenseNo, e.date, e.category, e.amount, e.paymentMode || '', e.vendor || '', e.description || '']),
      {
        colWidths: [16, 14, 22, 18, 14, 22, 35],
        formatCurrency: [false, false, false, true, false, false, false],
        totalRow: {
          label: 'TOTAL EXPENSES',
          values: ['', '', totalAmount, '', '', ''],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Purchase Orders to Excel
   */
  exportPurchaseOrders(orders: PurchaseOrder[], filename: string = 'Purchase_Orders'): void {
    const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — PURCHASE ORDERS',
      `${orders.length} purchase orders`,
      ['PO No', 'Supplier', 'Date', 'Status', 'Total (Nu.)'],
      orders.map(o => [o.poNo, o.supplierName || '', o.date, o.status, o.totalAmount]),
      {
        colWidths: [16, 28, 14, 14, 18],
        formatCurrency: [false, false, false, false, true],
        totalRow: {
          label: 'TOTAL',
          values: ['', '', '', totalAmount],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Quotations to Excel
   */
  exportQuotations(quotes: Quotation[], filename: string = 'Quotations'): void {
    const totalAmount = quotes.reduce((s, q) => s + q.totalAmount, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — QUOTATIONS',
      `${quotes.length} quotations issued`,
      ['Quote No', 'Customer', 'Date', 'Expiry', 'Status', 'Total (Nu.)'],
      quotes.map(q => [q.quoteNo, q.customerName || '', q.date, q.expiryDate || '', q.status, q.totalAmount]),
      {
        colWidths: [16, 28, 14, 14, 14, 18],
        formatCurrency: [false, false, false, false, false, true],
        totalRow: {
          label: 'TOTAL',
          values: ['', '', '', '', totalAmount],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Refunds to Excel
   */
  exportRefunds(refunds: Refund[], filename: string = 'Refunds'): void {
    const totalAmount = refunds.reduce((s, r) => s + r.totalAmount, 0);

    const ws = createStyledWorksheet(
      'JINDA POS — REFUND REGISTER',
      `${refunds.length} refunds processed`,
      ['Refund No', 'Date', 'Customer', 'Reason', 'Mode', 'Amount (Nu.)'],
      refunds.map(r => [r.refundNo, r.date, r.customerName || '', r.reason, r.refundMode, r.totalAmount]),
      {
        colWidths: [16, 14, 28, 28, 14, 18],
        formatCurrency: [false, false, false, false, false, true],
        totalRow: {
          label: 'TOTAL REFUNDS',
          values: ['', '', '', '', totalAmount],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Refunds');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Employees to Excel
   */
  exportEmployees(employees: any[], filename: string = 'Employees'): void {
    const activeEmployees = employees.filter(e => e.is_active === 1).length;
    const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0);

    const ws: XLSX.WorkSheet = {};
    ws['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 28 },
      { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    ];

    // Title
    ws['A1'] = {
      t: 's',
      v: 'JINDA POS — EMPLOYEE REGISTER',
      s: {
        font: { bold: true, size: 18, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '9B2335' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];

    // Summary
    ws['A3'] = {
      t: 's',
      v: `${activeEmployees} Active Employees | Total Salary: ${formatCurrency(totalSalary)}`,
      s: {
        font: { size: 10, color: { rgb: '64748B' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
      },
    };

    // Header row
    const headers = ['Emp No', 'Name', 'Position', 'Department', 'Phone', 'Email', 'Salary (Nu.)', 'PF Rate', 'TDS Rate', 'GIS Amount', 'HC Rate', 'Join Date', 'Status'];
    createStyledHeader(ws, 5, headers);

    // Data rows
    employees.forEach((emp, i) => {
      const row = 6 + i;
      const isAlt = i % 2 === 1;
      const values = [
        emp.employee_no || emp.employeeNo || '',
        emp.name || '',
        emp.position || '',
        emp.department || '',
        emp.phone || '',
        emp.email || '',
        emp.salary || 0,
        emp.pf_rate || 0,
        emp.tds_rate || 0,
        emp.gis_amount || 0,
        emp.hc_rate || 0,
        emp.join_date || emp.joinDate || '',
        emp.is_active === 1 ? 'Active' : 'Inactive',
      ];

      values.forEach((val, j) => {
        const col = XLSX.utils.encode_col(j);
        const cellRef = `${col}${row}`;
        const isCurrency = j === 6 || j === 9;

        ws[cellRef] = {
          t: isCurrency ? 'n' : 's',
          v: val,
          s: {
            font: { size: 10, color: { rgb: j === 12 ? (val === 'Active' ? '059669' : 'DC2626') : '1E2B3C' } },
            fill: isAlt ? { fgColor: { rgb: 'FDF8F0' } } : undefined,
            numFmt: isCurrency ? '#,##0.00' : undefined,
            alignment: {
              horizontal: isCurrency || j >= 7 ? 'right' : 'left',
              vertical: 'middle',
            },
          },
        };
      });
    });

    ws['!ref'] = `A1:M${5 + employees.length}`;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Export Aged Receivables to Excel
   */
  exportAgedReceivables(report: AgedReport): void {
    const ws = createStyledWorksheet(
      'JINDA POS — AGED RECEIVABLES',
      `As of ${report.asOfDate}`,
      ['Customer', 'Current (Nu.)', '31-60 Days (Nu.)', '61-90 Days (Nu.)', 'Over 90 (Nu.)', 'Total (Nu.)'],
      report.entries.map(e => [e.name, e.current, e.days31_60, e.days61_90, e.over90, e.total]),
      {
        colWidths: [28, 18, 18, 18, 18, 18],
        formatCurrency: [false, true, true, true, true, true],
        totalRow: {
          label: 'TOTAL',
          values: [report.totalCurrent, report.total31_60, report.total61_90, report.totalOver90, report.grandTotal],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aged Receivables');
    XLSX.writeFile(wb, 'Aged_Receivables.xlsx');
  }

  /**
   * Export Aged Payables to Excel
   */
  exportAgedPayables(report: AgedReport): void {
    const ws = createStyledWorksheet(
      'JINDA POS — AGED PAYABLES',
      `As of ${report.asOfDate}`,
      ['Supplier', 'Current (Nu.)', '31-60 Days (Nu.)', '61-90 Days (Nu.)', 'Over 90 (Nu.)', 'Total (Nu.)'],
      report.entries.map(e => [e.name, e.current, e.days31_60, e.days61_90, e.over90, e.total]),
      {
        colWidths: [28, 18, 18, 18, 18, 18],
        formatCurrency: [false, true, true, true, true, true],
        totalRow: {
          label: 'TOTAL',
          values: [report.totalCurrent, report.total31_60, report.total61_90, report.totalOver90, report.grandTotal],
        },
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aged Payables');
    XLSX.writeFile(wb, 'Aged_Payables.xlsx');
  }

  /**
   * Export any report to PDF with professional Bhutanese-themed layout.
   */
  exportToPDF(title: string, headers: string[], rows: string[][], filename: string, subtitle?: string): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Draw header
    const startY = drawHeader(doc, title, subtitle || `Jinda POS — ${title}`, pageWidth);

    // Table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      didDrawPage: (data: any) => {
        // Footer on each page
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Accounting & POS System for Bhutan', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    // Prayer flag bar at bottom
    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);

    doc.save(`${filename}.pdf`);
  }

  /**
   * Export Stock Report to PDF with professional formatting
   */
  exportStockReportPDF(data: StockReportItem[], summary?: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'STOCK REPORT', 'Inventory Valuation & Stock Levels', pageWidth);

    // Summary cards
    const totalValue = summary?.totalValue || data.reduce((s, i) => s + i.stockValue, 0);
    const totalItems = data.length;
    const lowStock = data.filter(i => i.stockStatus === 'low').length;
    const outOfStock = 0; // No 'out of stock' status in current type definition

    // Summary boxes
    const boxWidth = (pageWidth - 28) / 4;
    const boxY = startY + 4;

    // Total Value box
    doc.setFillColor(...C.navy);
    doc.roundedRect(14, boxY, boxWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('TOTAL VALUE', 14 + boxWidth / 2, boxY + 5, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text(formatCurrency(totalValue), 14 + boxWidth / 2, boxY + 12, { align: 'center' });

    // Total Items box
    doc.setFillColor(5, 150, 105); // emerald
    doc.roundedRect(14 + boxWidth + 2, boxY, boxWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('TOTAL ITEMS', 14 + boxWidth * 1.5 + 2, boxY + 5, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(...C.white);
    doc.text(String(totalItems), 14 + boxWidth * 1.5 + 2, boxY + 12, { align: 'center' });

    // Low Stock box
    doc.setFillColor(232, 160, 32); // saffron
    doc.roundedRect(14 + boxWidth * 2 + 4, boxY, boxWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80, 50, 10);
    doc.text('LOW STOCK', 14 + boxWidth * 2.5 + 4, boxY + 5, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(80, 50, 10);
    doc.text(String(lowStock), 14 + boxWidth * 2.5 + 4, boxY + 12, { align: 'center' });

    // Out of Stock box
    doc.setFillColor(220, 38, 38); // red
    doc.roundedRect(14 + boxWidth * 3 + 6, boxY, boxWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 200, 200);
    doc.text('OUT OF STOCK', 14 + boxWidth * 3.5 + 6, boxY + 5, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(String(outOfStock), 14 + boxWidth * 3.5 + 6, boxY + 12, { align: 'center' });

    // Table
    const headers = [['Item Name', 'Category', 'Stock', 'Unit Cost', 'Value', 'Status']];
    const rows = data.map(item => [
      item.name,
      item.category || 'N/A',
      String(item.quantityInStock),
      formatCurrency(item.averageCost),
      formatCurrency(item.stockValue),
      item.stockStatus === 'good' ? 'In Stock' : item.stockStatus === 'medium' ? 'Medium' : 'Low Stock',
    ]);

    // Add total row
    rows.push(['', '', '', 'TOTAL VALUE:', formatCurrency(totalValue), '']);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: boxY + 24,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center' },
      },
      didParseCell: (data) => {
        // Style status cells
        if (data.column.index === 5 && data.section === 'body') {
          const status = String(data.cell.raw);
          if (status === 'In Stock') {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Medium') {
            data.cell.styles.textColor = [232, 160, 32];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Low Stock') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Style total row
        if (data.section === 'body' && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = C.navy;
          data.cell.styles.textColor = C.white;
        }
      },
      didDrawPage: (data: any) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Stock Report', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);
    doc.save('Stock_Report.pdf');
  }

  /**
   * Export Sales Report to PDF with professional formatting
   */
  exportSalesReportPDF(transactions: Transaction[], summary: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'SALES REPORT', 'Transaction Summary & Revenue Analysis', pageWidth);

    // Summary data
    const totalRevenue = summary?.totalRevenue || 0;
    const totalGst = summary?.totalGst || 0;
    const totalTransactions = summary?.totalTransactions || 0;
    const totalDiscount = summary?.totalDiscount || 0;

    // Summary boxes
    const boxWidth = (pageWidth - 28) / 4;
    const boxY = startY + 4;

    // Total Revenue box
    doc.setFillColor(...C.navy);
    doc.roundedRect(14, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('TOTAL REVENUE', 14 + boxWidth / 2, boxY + 6, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text(formatCurrency(totalRevenue), 14 + boxWidth / 2, boxY + 13, { align: 'center' });

    // GST Collected box
    doc.setFillColor(147, 51, 234); // purple
    doc.roundedRect(14 + boxWidth + 2, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(230, 210, 255);
    doc.text('GST COLLECTED', 14 + boxWidth * 1.5 + 2, boxY + 6, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(totalGst), 14 + boxWidth * 1.5 + 2, boxY + 13, { align: 'center' });

    // Transactions box
    doc.setFillColor(37, 99, 235); // blue
    doc.roundedRect(14 + boxWidth * 2 + 4, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 220, 255);
    doc.text('TRANSACTIONS', 14 + boxWidth * 2.5 + 4, boxY + 6, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(String(totalTransactions), 14 + boxWidth * 2.5 + 4, boxY + 13, { align: 'center' });

    // Discounts box
    doc.setFillColor(220, 38, 38); // red
    doc.roundedRect(14 + boxWidth * 3 + 6, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 200, 200);
    doc.text('DISCOUNTS', 14 + boxWidth * 3.5 + 6, boxY + 6, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(totalDiscount), 14 + boxWidth * 3.5 + 6, boxY + 13, { align: 'center' });

    // Table
    const headers = [['Invoice', 'Date', 'Customer', 'Subtotal', 'GST', 'Discount', 'Net Total', 'Payment']];
    const rows = transactions.map(t => [
      `#${t.transactionNo}`,
      t.date,
      t.contactName || 'Walk-in',
      formatCurrency(t.totalAmount),
      formatCurrency(t.gstAmount),
      t.discountAmount > 0 ? `-${formatCurrency(t.discountAmount)}` : '--',
      formatCurrency(t.netAmount),
      (t.paymentMode || 'cash').toUpperCase(),
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: boxY + 26,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 7.5,
        cellPadding: 3.5,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 35 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
        7: { halign: 'center', cellWidth: 20 },
      },
      didParseCell: (data) => {
        // Color code payment modes
        if (data.column.index === 7 && data.section === 'body') {
          const mode = String(data.cell.raw).toLowerCase();
          if (mode === 'cash') data.cell.styles.textColor = [5, 150, 105];
          else if (mode === 'credit') data.cell.styles.textColor = [37, 99, 235];
          else if (mode === 'bank') data.cell.styles.textColor = [147, 51, 234];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data: any) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Sales Report', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);
    doc.save('Sales_Report.pdf');
  }

  /**
   * Export Purchase Report to PDF with professional formatting
   */
  exportPurchaseReportPDF(transactions: Transaction[], summary: any): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'PURCHASE REPORT', 'Supplier Transactions & Input Summary', pageWidth);

    // Summary data
    const totalPurchases = summary?.totalPurchases || 0;
    const totalGst = summary?.totalGst || 0;
    const totalTransactions = summary?.totalTransactions || 0;

    // Summary boxes
    const boxWidth = (pageWidth - 28) / 3;
    const boxY = startY + 4;

    // Total Purchases box
    doc.setFillColor(...C.navy);
    doc.roundedRect(14, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text('TOTAL PURCHASES', 14 + boxWidth / 2, boxY + 6, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text(formatCurrency(totalPurchases), 14 + boxWidth / 2, boxY + 13, { align: 'center' });

    // GST Input box
    doc.setFillColor(147, 51, 234); // purple
    doc.roundedRect(14 + boxWidth + 2, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(230, 210, 255);
    doc.text('GST INPUT', 14 + boxWidth * 1.5 + 2, boxY + 6, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(totalGst), 14 + boxWidth * 1.5 + 2, boxY + 13, { align: 'center' });

    // Transactions box
    doc.setFillColor(37, 99, 235); // blue
    doc.roundedRect(14 + boxWidth * 2 + 4, boxY, boxWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(200, 220, 255);
    doc.text('TRANSACTIONS', 14 + boxWidth * 2.5 + 4, boxY + 6, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(String(totalTransactions), 14 + boxWidth * 2.5 + 4, boxY + 13, { align: 'center' });

    // Table
    const headers = [['Transaction', 'Date', 'Supplier', 'Subtotal', 'GST', 'Net Total', 'Payment']];
    const rows = transactions.map(t => [
      `#${t.transactionNo}`,
      t.date,
      t.contactName || 'N/A',
      formatCurrency(t.totalAmount - t.gstAmount),
      formatCurrency(t.gstAmount),
      formatCurrency(t.netAmount),
      (t.paymentMode || 'cash').toUpperCase(),
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: boxY + 26,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 38 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
        6: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const mode = String(data.cell.raw).toLowerCase();
          if (mode === 'cash') data.cell.styles.textColor = [5, 150, 105];
          else if (mode === 'credit') data.cell.styles.textColor = [37, 99, 235];
          else if (mode === 'bank') data.cell.styles.textColor = [147, 51, 234];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data: any) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Purchase Report', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);
    doc.save('Purchase_Report.pdf');
  }

  /**
   * Export Outstanding Report to PDF with professional formatting
   */
  exportOutstandingPDF(data: OutstandingItem[]): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'OUTSTANDING REPORT', 'Trade Partner Balances & Aging', pageWidth);

    // Summary
    const totalOutstanding = data.reduce((s, i) => s + i.totalDue, 0);
    const totalCustomers = data.length;

    // Summary box
    doc.setFillColor(...C.crimson);
    doc.roundedRect(14, startY + 4, pageWidth - 28, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL OUTSTANDING', 24, startY + 11);
    doc.setFontSize(14);
    doc.setTextColor(255, 215, 0); // gold
    doc.text(formatCurrency(totalOutstanding), pageWidth - 24, startY + 11, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text(`${totalCustomers} trade partners with pending dues`, 24, startY + 18);

    // Table
    const headers = [['Name', 'Type', 'Balance', 'Due Amount', 'Days Overdue']];
    const rows = data.map(item => [
      item.name,
      item.type || 'Customer',
      formatCurrency(item.currentBalance),
      formatCurrency(item.totalDue),
      `${Math.round(item.daysOverdue || 0)} days`,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: startY + 30,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 25 },
      },
      didParseCell: (data) => {
        // Highlight overdue amounts
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
        // Color code days overdue
        if (data.column.index === 4 && data.section === 'body') {
          const days = parseInt(String(data.cell.raw)) || 0;
          if (days > 30) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [232, 160, 32];
          }
        }
      },
      didDrawPage: (data: any) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Outstanding Report', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);
    doc.save('Outstanding_Report.pdf');
  }

  /**
   * Export Trial Balance to PDF
   */
  exportTrialBalancePDF(data: TrialBalanceItem[], asOfDate: string): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'TRIAL BALANCE', `As of ${asOfDate}`, pageWidth);

    // Summary
    const totalDebit = data.reduce((s, i) => s + i.debit, 0);
    const totalCredit = data.reduce((s, i) => s + i.credit, 0);

    // Table
    const headers = [['Code', 'Account Name', 'Debit (Nu.)', 'Credit (Nu.)']];
    const rows = data.map(item => [
      item.code,
      item.name,
      item.debit > 0 ? formatCurrency(item.debit) : '--',
      item.credit > 0 ? formatCurrency(item.credit) : '--',
    ]);

    // Add total row
    rows.push(['', 'TOTAL', formatCurrency(totalDebit), formatCurrency(totalCredit)]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: startY + 4,
      margin: { left: 14, right: 14, bottom: 22 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: C.slate,
        lineColor: C.ash,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.crimson,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: C.cream,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 70 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
      didParseCell: (data) => {
        // Style total row
        if (data.section === 'body' && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = C.navy;
          data.cell.styles.textColor = C.white;
        }
      },
      didDrawPage: (data: any) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...C.crimson);
        doc.rect(0, ph - 16, pageWidth, 16, 'F');
        doc.setFillColor(...C.saffron);
        doc.rect(0, ph - 16, pageWidth, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Jinda POS — Trial Balance', 14, ph - 10);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, ph - 10, { align: 'right' });
        doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });
      },
    });

    drawFlagBar(doc, doc.internal.pageSize.getHeight() - 4, pageWidth);
    doc.save(`Trial_Balance_${asOfDate}.pdf`);
  }

  /**
   * Export Profit & Loss to PDF
   */
  exportProfitLossPDF(data: ProfitLossData): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'PROFIT & LOSS STATEMENT', 'Revenue, Expenses & Net Result', pageWidth);

    let y = startY + 8;

    // Revenue Section
    doc.setFillColor(5, 150, 105); // emerald
    doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('REVENUE & INCOME', 20, y + 5.5);
    y += 12;

    // Revenue items
    const revenueItems = [
      { label: 'Product Sales', value: data.revenue.sales },
      { label: 'Other Income', value: data.revenue.otherIncome },
    ];

    revenueItems.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text(item.label, 20, y + 2);
      doc.setTextColor(...C.navy);
      doc.text(formatCurrency(item.value), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Total Revenue
    doc.setFillColor(5, 150, 105);
    doc.rect(14, y - 2, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL REVENUE', 20, y + 3.5);
    doc.text(formatCurrency(data.revenue.total), pageWidth - 20, y + 3.5, { align: 'right' });
    y += 14;

    // Expenses Section
    doc.setFillColor(220, 38, 38); // red
    doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('OPERATIONAL EXPENDITURES', 20, y + 5.5);
    y += 12;

    // Expense items
    const expenseItems = [
      { label: 'Cost of Goods Sold', value: data.expenses.cogs },
      { label: 'Operating Expenses', value: data.expenses.operating },
      { label: 'Other Expenses', value: data.expenses.other },
    ];

    expenseItems.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text(item.label, 20, y + 2);
      doc.setTextColor(...C.navy);
      doc.text(formatCurrency(item.value), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Total Expenses
    doc.setFillColor(220, 38, 38);
    doc.rect(14, y - 2, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL EXPENSES', 20, y + 3.5);
    doc.text(formatCurrency(data.expenses.total), pageWidth - 20, y + 3.5, { align: 'right' });
    y += 14;

    // Gross Profit
    doc.setFillColor(...C.ash);
    doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.slate);
    doc.text('GROSS PROFIT', 20, y + 6.5);
    doc.setTextColor(...C.navy);
    doc.text(formatCurrency(data.grossProfit), pageWidth - 20, y + 6.5, { align: 'right' });
    y += 16;

    // Net Profit
    doc.setFillColor(...C.navy);
    doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('NET PROFIT', 20, y + 9);
    doc.setFontSize(14);
    doc.setTextColor(255, 215, 0); // gold
    doc.text(formatCurrency(data.netProfit), pageWidth - 20, y + 9, { align: 'right' });

    // Footer
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...C.crimson);
    doc.rect(0, ph - 16, pageWidth, 16, 'F');
    doc.setFillColor(...C.saffron);
    doc.rect(0, ph - 16, pageWidth, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Jinda POS — Profit & Loss Statement', 14, ph - 10);
    doc.text('Page 1 of 1', pageWidth - 14, ph - 10, { align: 'right' });
    doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });

    drawFlagBar(doc, ph - 4, pageWidth);
    doc.save('Profit_Loss_Statement.pdf');
  }

  /**
   * Export Balance Sheet to PDF
   */
  exportBalanceSheetPDF(data: BalanceSheetData): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = drawHeader(doc, 'BALANCE SHEET', 'Assets, Liabilities & Equity', pageWidth);

    let y = startY + 8;

    // Assets Section
    doc.setFillColor(5, 150, 105); // emerald
    doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('CORPORATE ASSETS', 20, y + 5.5);
    y += 12;

    // Current Assets header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CURRENT ASSETS', 20, y + 3);
    y += 7;

    data.assets.current.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text('  ' + item.name, 20, y + 2);
      doc.text(formatCurrency(item.balance), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Fixed Assets header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('FIXED ASSETS', 20, y + 3);
    y += 7;

    data.assets.fixed.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text('  ' + item.name, 20, y + 2);
      doc.text(formatCurrency(item.balance), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Total Assets
    doc.setFillColor(5, 150, 105);
    doc.rect(14, y - 2, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL ASSETS', 20, y + 3.5);
    doc.text(formatCurrency(data.assets.total), pageWidth - 20, y + 3.5, { align: 'right' });
    y += 14;

    // Liabilities Section
    doc.setFillColor(128, 0, 0); // maroon
    doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('LIABILITIES & CAPITAL', 20, y + 5.5);
    y += 12;

    // Current Liabilities header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CURRENT LIABILITIES', 20, y + 3);
    y += 7;

    data.liabilities.current.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text('  ' + item.name, 20, y + 2);
      doc.text(formatCurrency(item.balance), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Long-term Liabilities header
    if (data.liabilities.longTerm.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('LONG-TERM LIABILITIES', 20, y + 3);
      y += 7;

    data.liabilities.longTerm.forEach((item, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(...C.cream);
          doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...C.slate);
        doc.text('  ' + item.name, 20, y + 2);
        doc.text(formatCurrency(item.balance), pageWidth - 20, y + 2, { align: 'right' });
        y += 7;
      });
    }

    // Total Liabilities
    doc.setFillColor(128, 0, 0);
    doc.rect(14, y - 2, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL LIABILITIES', 20, y + 3.5);
    doc.text(formatCurrency(data.liabilities.total), pageWidth - 20, y + 3.5, { align: 'right' });
    y += 14;

    // Equity header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('EQUITY / CAPITAL', 20, y + 3);
    y += 7;

    data.equity.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...C.cream);
        doc.rect(14, y - 2, pageWidth - 28, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      doc.text('  ' + item.name, 20, y + 2);
      doc.text(formatCurrency(item.balance), pageWidth - 20, y + 2, { align: 'right' });
      y += 7;
    });

    // Total Equity + Liabilities
    doc.setFillColor(...C.navy);
    doc.roundedRect(14, y, pageWidth - 28, 12, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL EQUITY + LIABILITIES', 20, y + 8);
    doc.setFontSize(13);
    doc.setTextColor(255, 215, 0); // gold
    doc.text(formatCurrency(data.totalEquity), pageWidth - 20, y + 8, { align: 'right' });

    // Footer
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...C.crimson);
    doc.rect(0, ph - 16, pageWidth, 16, 'F');
    doc.setFillColor(...C.saffron);
    doc.rect(0, ph - 16, pageWidth, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Jinda POS — Balance Sheet', 14, ph - 10);
    doc.text('Page 1 of 1', pageWidth - 14, ph - 10, { align: 'right' });
    doc.text('Powered by Phojaa95', pageWidth / 2, ph - 10, { align: 'center' });

    drawFlagBar(doc, ph - 4, pageWidth);
    doc.save('Balance_Sheet.pdf');
  }
}

export const exportService = new ExportService();
