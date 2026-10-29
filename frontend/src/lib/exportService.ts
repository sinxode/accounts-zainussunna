import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Sanitizes cell values to prevent spreadsheet formula injection attacks (CSV/Excel)
 * Values beginning with '=', '+', '-', '@', '\t', or '\r' are prefixed with a single quote.
 */
function sanitizeFormulaInjection(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export const exportService = {
  /**
   * Exports structured tabular data to CSV with UTF-8 BOM and formula injection protection
   */
  exportToCSV(
    _title: string,
    columns: string[],
    rows: (string | number | boolean | null)[][],
    fileName: string
  ) {
    const sanitizeCsvCell = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const sanitized = sanitizeFormulaInjection(val);
      const str = String(sanitized);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = columns.map(sanitizeCsvCell).join(',');
    const dataLines = rows.map(row => row.map(sanitizeCsvCell).join(','));

    // UTF-8 BOM (\uFEFF) ensures Excel and text editors properly recognize UTF-8 encoding (Malayalam, INR, etc.)
    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Exports data to Excel (.xlsx) with clean numeric cell formatting and column widths
   */
  exportToExcel(
    dataOrTitle: Record<string, unknown>[] | string,
    fileNameOrColumns: string | string[],
    maybeRows?: (string | number | boolean | null)[][],
    maybeFileName?: string
  ) {
    let excelRows: Record<string, unknown>[] = [];
    let fileName = 'report';

    if (Array.isArray(dataOrTitle)) {
      // Legacy signature: exportToExcel(data, fileName)
      excelRows = dataOrTitle.map(item => {
        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(item)) {
          sanitized[key] = sanitizeFormulaInjection(val);
        }
        return sanitized;
      });
      fileName = typeof fileNameOrColumns === 'string' ? fileNameOrColumns : 'report';
    } else {
      // Modern signature: exportToExcel(title, columns, rows, fileName)
      const columns = Array.isArray(fileNameOrColumns) ? fileNameOrColumns : [];
      const rows = maybeRows || [];
      fileName = maybeFileName || 'report';

      excelRows = rows.map(row => {
        const rowObj: Record<string, unknown> = {};
        columns.forEach((col, idx) => {
          let val = row[idx];
          if (typeof val === 'string') {
            // Check if string represents a monetary currency like "₹1,250.00" or "-₹500.00"
            const cleanCurrency = val.replace(/[₹\s,]/g, '');
            if (/^[+-]?\d+(\.\d+)?$/.test(cleanCurrency)) {
              val = Number(cleanCurrency);
            } else {
              val = sanitizeFormulaInjection(val);
            }
          }
          rowObj[col] = val ?? '';
        });
        return rowObj;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    
    // Auto-size columns based on maximum content length
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const wscols = Array(range.e.c + 1).fill({ wch: 22 }); 
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    const sheetTitle = typeof dataOrTitle === 'string' ? dataOrTitle.slice(0, 31) : 'Report';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle || 'Report');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * Enhanced PDF Export using jsPDF and autoTable with official Zainussunna Academy styling
   */
  exportToPDF(
    title: string,
    columns: string[],
    rows: (string | number | boolean | null)[][],
    fileName: string,
    type?: 'statement' | 'receipt' | 'report' | 'cashbook' | 'aging' | 'audit'
  ) {
    // Replace all Rupee symbols with 'Rs. ' to prevent font glyph rendering artifacts in jsPDF Helvetica
    const cleanTitle = title.replace(/₹/g, 'Rs. ');
    const cleanColumns = columns.map(c => c.replace(/₹/g, 'Rs. '));
    const cleanRows = rows.map(row => 
      row.map(cell => cell === null ? null : typeof cell === 'string' ? cell.replace(/₹/g, 'Rs. ') : cell)
    );

    const doc = new jsPDF({
      orientation: columns.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Draw Top Accent Banner (Deep Navy Blue #1E3A5F)
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 6, 'F');
    
    // Header Y position starts below banner
    let currentY = 16;
    
    // Left: Academy Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 95); // Navy primary
    doc.text("ZAINUSSUNNA ACADEMY", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128); // Neutral grey
    doc.text("FINANCIAL MANAGEMENT & AUDIT SYSTEM", 14, currentY + 5);

    // Right: Document Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const dateStr = new Date().toISOString().split('T')[0];
    doc.text(`Generated: ${dateStr}`, pageWidth - 14, currentY, { align: 'right' });
    doc.text(`Doc Ref: ZLS-REC-${Date.now().toString(36).toUpperCase()}`, pageWidth - 14, currentY + 5, { align: 'right' });

    // Divider Line
    doc.setDrawColor(229, 231, 235); // Light grey border #E5E7EB
    doc.setLineWidth(0.4);
    doc.line(14, currentY + 9, pageWidth - 14, currentY + 9);
    
    currentY += 16;
    
    // Document Title Card
    if (type === 'statement') {
      const parts = cleanTitle.split(':');
      const docType = parts[0]?.trim() || 'Account Statement';
      const holderName = parts[1]?.trim() || 'Student Account';
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, currentY, pageWidth - 28, 18, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 18, 1.5, 1.5, 'S');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 95);
      doc.text(docType.toUpperCase(), 18, currentY + 6);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(holderName, 18, currentY + 13);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("SCOPE: AUTHORITATIVE LEDGER", pageWidth - 18, currentY + 6, { align: 'right' });
      doc.text(`DATE: ${dateStr}`, pageWidth - 18, currentY + 13, { align: 'right' });
      
      currentY += 24;
    } else {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, currentY, pageWidth - 28, 13, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 13, 1.5, 1.5, 'S');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 95);
      doc.text(cleanTitle.toUpperCase(), 18, currentY + 8.5);
      
      currentY += 19;
    }
    
    // AutoTable Configuration with repeated headers and pagination
    autoTable(doc, {
      startY: currentY,
      head: [cleanColumns],
      body: cleanRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [30, 58, 95], // Navy primary #1E3A5F
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
        valign: 'middle',
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3.5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: cleanColumns.reduce((acc, col, index) => {
        const lowerCol = col.toLowerCase();
        if (
          lowerCol.includes('amount') || 
          lowerCol.includes('balance') || 
          lowerCol.includes('outstanding') || 
          lowerCol.includes('recovered') ||
          lowerCol.includes('principal') ||
          lowerCol.includes('value')
        ) {
          acc[index] = { 
            halign: 'right', 
            fontStyle: 'bold',
          };
        } else if (
          lowerCol === 'type' || 
          lowerCol === 'direction' ||
          lowerCol === 'status' || 
          lowerCol === 'risk' ||
          lowerCol === 'days' ||
          lowerCol === 'action'
        ) {
          acc[index] = {
            halign: 'center'
          };
        }
        return acc;
      }, {} as any),
      didParseCell: (data) => {
        const val = String(data.cell.raw || '');
        if (val.startsWith('+') || val.startsWith('deposit') || val.startsWith('credit') || val.toLowerCase() === 'active') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald Green
        } else if (val.startsWith('-') || val.startsWith('withdrawal') || val.startsWith('debit') || val.toLowerCase() === 'reversed') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose Red
        } else if (val.toLowerCase() === 'high' || val.toLowerCase() === 'overdue' || val.toLowerCase() === 'critical') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.toLowerCase() === 'medium' || val.toLowerCase() === 'warning') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: () => {
        // Footer Divider
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
        
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "Zainussunna Academy Ledger System - Official Institutional Record",
          14,
          pageHeight - 5
        );
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - 14,
          pageHeight - 5,
          { align: 'right' }
        );
      }
    });

    doc.save(`${fileName}.pdf`);
  }
};
