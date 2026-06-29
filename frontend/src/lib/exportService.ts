import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportService = {
  /**
   * Exports data to Excel with professional header styling
   */
  exportToExcel(data: Record<string, unknown>[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const wscols = Array(range.e.c + 1).fill({wch: 18}); 
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  /**
   * Enhanced PDF Export using autoTable
   */
  exportToPDF(title: string, columns: string[], rows: (string | number | boolean | null)[][], fileName: string, type?: 'statement' | 'receipt' | 'report') {
    // Replace all Rupee symbols with 'Rs. ' to prevent font rendering artifacts in jsPDF
    const cleanTitle = title.replace(/₹/g, 'Rs. ');
    const cleanColumns = columns.map(c => c.replace(/₹/g, 'Rs. '));
    const cleanRows = rows.map(row => 
      row.map(cell => cell === null ? null : typeof cell === 'string' ? cell.replace(/₹/g, 'Rs. ') : cell)
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Draw Top Accent Banner (Navy Blue)
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 6, 'F');
    
    // Header Y position starts below banner
    let currentY = 18;
    
    // Left: Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 95); // Primary Navy
    doc.text("ZAINUSSUNNA LEDGER", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Secondary Grey
    doc.text("ACADEMY FINANCIAL PLATFORM", 14, currentY + 5);

    // Right: Document Meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, currentY, { align: 'right' });
    doc.text(`Doc ID: ZLS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, pageWidth - 14, currentY + 5, { align: 'right' });

    // Divider Line
    doc.setDrawColor(229, 231, 235); // Light grey border
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 10, pageWidth - 14, currentY + 10);
    
    currentY += 18;
    
    // Title / Title Card
    if (type === 'statement') {
      const parts = cleanTitle.split(':');
      const docType = parts[0]?.trim() || 'Account Statement';
      const holderName = parts[1]?.trim() || '';
      
      // Draw a subtle box for statement holder info
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'S');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 95);
      doc.text(docType.toUpperCase(), 20, currentY + 7);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39); // Text Primary
      doc.text(holderName, 20, currentY + 14);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text("TYPE: STUDENT ACCOUNT", pageWidth - 20, currentY + 7, { align: 'right' });
      doc.text(`PERIOD: ACTIVE TIMELINE`, pageWidth - 20, currentY + 14, { align: 'right' });
      
      currentY += 28;
    } else {
      // Standard Report Header Card
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'S');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 58, 95);
      doc.text(cleanTitle.toUpperCase(), 20, currentY + 9);
      
      currentY += 22;
    }
    
    // Modern Table Configuration
    autoTable(doc, {
      startY: currentY,
      head: [cleanColumns],
      body: cleanRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [30, 58, 95], // Navy primary
        textColor: [255, 255, 255], // White
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        valign: 'middle',
      },
      styles: { 
        fontSize: 8.5,
        cellPadding: 4,
        textColor: [55, 65, 81], // text-secondary
        lineColor: [229, 231, 235], // light grey
        lineWidth: 0.1, // fine borders
      },
      columnStyles: cleanColumns.reduce((acc, col, index) => {
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('amount') || lowerCol.includes('balance') || lowerCol.includes('outstanding') || lowerCol.includes('value')) {
          acc[index] = { 
            halign: 'right', 
            fontStyle: 'bold',
            cellWidth: 'wrap'
          };
        } else if (lowerCol === 'type' || lowerCol === 'status' || lowerCol === 'risk level') {
          acc[index] = {
            halign: 'center'
          };
        }
        return acc;
      }, {} as any),
      didParseCell: (data) => {
        const val = String(data.cell.raw || '');
        if (val.startsWith('+') || val.startsWith('deposit') || val.startsWith('credit')) {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald Green
        } else if (val.startsWith('-') || val.startsWith('withdrawal') || val.startsWith('debit')) {
          data.cell.styles.textColor = [239, 68, 68]; // Crimson Red
        } else if (val.toLowerCase() === 'high' || val.toLowerCase() === 'overdue' || val.toLowerCase() === 'critical') {
          data.cell.styles.textColor = [239, 68, 68]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (val.toLowerCase() === 'medium' || val.toLowerCase() === 'warning') {
          data.cell.styles.textColor = [245, 158, 11]; // Warning Orange
          data.cell.styles.fontStyle = 'bold';
        } else if (val.toLowerCase() === 'success' || val.toLowerCase() === 'active' || val.toLowerCase() === 'low') {
          data.cell.styles.textColor = [16, 185, 129]; // Green
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Ensure numeric formatting checks
        if (data.column.raw && String(data.column.raw).toLowerCase().includes('amount')) {
          const rawVal = data.cell.raw;
          if (typeof rawVal === 'number') {
             data.cell.text = [rawVal.toLocaleString()];
          }
        }
      },
      didDrawPage: () => {
        // Draw Footer Divider
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
        
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175); // Text muted grey
        doc.text(
          "Zainussunna Academy Ledger System - System Generated Document",
          14,
          pageHeight - 6
        );
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - 20,
          pageHeight - 6,
          { align: 'right' }
        );
      }
    });

    doc.save(`${fileName}.pdf`);
  }
};
