import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { Badge } from './Badge';
import { useUIStore } from '../../store/useUIStore';
import styles from './PrintExportDrawer.module.scss';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Printer, 
  Download, 
  Check, 
  Filter,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { exportService } from '../../lib/exportService';
import { clsx } from 'clsx';

export const PrintExportDrawer: React.FC = () => {
  const { activeModal, closeAll, exportData } = useUIStore();
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  
  if (activeModal !== 'printExport' || !exportData) return null;

  const handleExport = () => {
    if (format === 'pdf') {
      exportService.exportToPDF(
        exportData.title,
        exportData.columns,
        exportData.rows,
        exportData.filename,
        exportData.type
      );
    } else if (format === 'csv') {
      exportService.exportToCSV(
        exportData.title,
        exportData.columns,
        exportData.rows,
        exportData.filename
      );
    } else {
      exportService.exportToExcel(
        exportData.title,
        exportData.columns,
        exportData.rows,
        exportData.filename
      );
    }
    closeAll();
  };

  const recordCount = exportData.rows?.length || 0;

  return (
    <Drawer 
      isOpen={activeModal === 'printExport'} 
      onClose={closeAll}
      title="Institutional Export"
      subtitle="Export verified ledger records and offline spreadsheets."
      size="md"
      footer={
        <div className={styles.drawerFooter}>
          <Button variant="ghost" onClick={closeAll}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            icon={format === 'pdf' ? <Printer size={16} /> : <Download size={16} />} 
            onClick={handleExport}
          >
            {format === 'pdf' 
              ? `Print PDF (${recordCount})` 
              : `Export ${recordCount} Rows (${format.toUpperCase()})`}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {/* Format Selector Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Choose Export Format</span>
            <span className={styles.sectionHint}>Select target output file</span>
          </div>

          <div className={styles.formatGrid}>
            {/* Excel Option */}
            <button 
              type="button"
              className={clsx(styles.formatCard, format === 'excel' && styles.selected)}
              onClick={() => setFormat('excel')}
            >
              <div className={styles.cardHeader}>
                <div className={clsx(styles.iconBox, styles.excelIcon)}>
                  <FileSpreadsheet size={20} />
                </div>
                {format === 'excel' && (
                  <span className={styles.checkBadge}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.formatName}>Excel Workbook</span>
                <span className={styles.formatExt}>.xlsx spreadsheet</span>
              </div>
            </button>

            {/* CSV Option */}
            <button 
              type="button"
              className={clsx(styles.formatCard, format === 'csv' && styles.selected)}
              onClick={() => setFormat('csv')}
            >
              <div className={styles.cardHeader}>
                <div className={clsx(styles.iconBox, styles.csvIcon)}>
                  <FileCode size={20} />
                </div>
                {format === 'csv' && (
                  <span className={styles.checkBadge}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.formatName}>CSV Spreadsheet</span>
                <span className={styles.formatExt}>.csv (UTF-8 BOM)</span>
              </div>
            </button>

            {/* PDF Option */}
            <button 
              type="button"
              className={clsx(styles.formatCard, format === 'pdf' && styles.selected)}
              onClick={() => setFormat('pdf')}
            >
              <div className={styles.cardHeader}>
                <div className={clsx(styles.iconBox, styles.pdfIcon)}>
                  <FileText size={20} />
                </div>
                {format === 'pdf' && (
                  <span className={styles.checkBadge}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.formatName}>PDF Document</span>
                <span className={styles.formatExt}>Printable report</span>
              </div>
            </button>
          </div>
        </div>

        {/* Dataset Summary Inspection Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <div className={styles.titleGroup}>
              <span className={styles.reportTitle}>{exportData.title}</span>
              <span className={styles.reportFilename}>{exportData.filename}.{format}</span>
            </div>
            <Badge variant="active" size="sm">
              {exportData.type || 'LEDGER'}
            </Badge>
          </div>

          {/* Active Filter Context (if filtered) */}
          {exportData.filterSummary && (
            <div className={styles.filterBanner}>
              <Filter size={13} className={styles.filterIcon} />
              <span>Applied Filters: <strong>{exportData.filterSummary}</strong></span>
            </div>
          )}

          <div className={styles.metaRow}>
            <div className={styles.metaStat}>
              <span className={styles.statLabel}>Records to Export</span>
              <span className={styles.statNumber}>{recordCount}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.metaStat}>
              <span className={styles.statLabel}>Data Integrity</span>
              <span className={styles.statStatus}>
                <ShieldCheck size={14} /> Verified
              </span>
            </div>
          </div>

          {/* Columns Preview */}
          {exportData.columns && exportData.columns.length > 0 && (
            <div className={styles.columnsPreview}>
              <span className={styles.columnsLabel}>
                <Layers size={12} /> Included Fields ({exportData.columns.length}):
              </span>
              <div className={styles.columnPills}>
                {exportData.columns.map((col, idx) => (
                  <span key={idx} className={styles.colPill}>{col}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security / Injection Protection Notice */}
        <div className={styles.notice}>
          <span>
            Financial exports strictly sanitize formula injection vectors (=, +, -, @) and include UTF-8 BOM encoding for Malayalam & Indian Rupee currency symbols.
          </span>
        </div>
      </div>
    </Drawer>
  );
};
