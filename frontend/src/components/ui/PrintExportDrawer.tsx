import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { useUIStore } from '../../store/useUIStore';
import styles from './PrintExportDrawer.module.scss';
import { FileText, FileSpreadsheet, FileCode, Printer, Download } from 'lucide-react';
import { exportService } from '../../lib/exportService';
import { clsx } from 'clsx';

export const PrintExportDrawer: React.FC = () => {
  const { activeModal, closeAll, exportData } = useUIStore();
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
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
  };

  return (
    <Drawer 
      isOpen={activeModal === 'printExport'} 
      onClose={closeAll}
      title="Print & Export"
      subtitle="Select your preferred report export format."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeAll}>Cancel</Button>
            <Button 
              icon={format === 'pdf' ? <Printer size={18} /> : <Download size={18} />} 
              onClick={handleExport}
            >
              {format === 'pdf' ? 'Download PDF' : format === 'csv' ? 'Download CSV' : 'Download Excel'}
            </Button>
        </div>
      }
    >
      <div className={styles.settings}>
        <div className={styles.section}>
          <span className={styles.label}>Export Format</span>
          <div className={styles.optionGrid}>
            <button 
              className={clsx(styles.formatBtn, format === 'pdf' && styles.active)}
              onClick={() => setFormat('pdf')}
              type="button"
            >
              <FileText size={24} />
              <span>PDF Document</span>
            </button>
            <button 
              className={clsx(styles.formatBtn, format === 'excel' && styles.active)}
              onClick={() => setFormat('excel')}
              type="button"
            >
              <FileSpreadsheet size={24} />
              <span>Excel (.xlsx)</span>
            </button>
            <button 
              className={clsx(styles.formatBtn, format === 'csv' && styles.active)}
              onClick={() => setFormat('csv')}
              type="button"
            >
              <FileCode size={24} />
              <span>CSV Spreadsheet</span>
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.label}>Document Settings & Metadata</span>
          <div className="flex flex-col gap-3">
            <div className="text-xs text-muted">
              Report Title: <span className="font-bold text-primary">{exportData.title}</span>
            </div>
            <div className="text-xs text-muted">
              Document Type: <span className="font-bold text-primary uppercase">{exportData.type || 'REPORT'}</span>
            </div>
            <div className="text-xs text-muted">
              Total Records to Export: <span className="font-bold text-primary">{exportData.rows.length}</span>
            </div>
            <div className="text-xs text-muted">
              Character Encoding: <span className="font-bold text-primary">UTF-8 Unicode (Malayalam & Currency Safe)</span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
