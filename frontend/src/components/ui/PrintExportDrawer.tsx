import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { useUIStore } from '../../store/useUIStore';
import styles from './PrintExportDrawer.module.scss';
import { FileText, FileSpreadsheet, Printer, Download } from 'lucide-react';
import { exportService } from '../../lib/exportService';
import { clsx } from 'clsx';

export const PrintExportDrawer: React.FC = () => {
  const { activeModal, closeAll, exportData } = useUIStore();
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  
  if (activeModal !== 'printExport' || !exportData) return null;

  const handleExport = () => {
    if (format === 'pdf') {
      exportService.exportToPDF(
        exportData.title,
        exportData.columns,
        exportData.rows,
        exportData.filename,
        exportData.type // Pass the type
      );
    } else {
      const excelData = exportData.rows.map(row => {
        const obj: any = {};
        exportData.columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
      exportService.exportToExcel(excelData, exportData.filename);
    }
  };

  return (
    <Drawer 
      isOpen={activeModal === 'printExport'} 
      onClose={closeAll}
      title="Print & Export"
      subtitle="Configure your export settings."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeAll}>Cancel</Button>
            <Button 
              icon={format === 'pdf' ? <Printer size={18} /> : <Download size={18} />} 
              onClick={handleExport}
            >
              {format === 'pdf' ? 'Download PDF' : 'Download Excel'}
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
              >
                <FileText size={24} />
                <span>PDF</span>
              </button>
              <button 
                className={clsx(styles.formatBtn, format === 'excel' && styles.active)}
                onClick={() => setFormat('excel')}
              >
                <FileSpreadsheet size={24} />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.label}>Document Settings</span>
            <div className="flex flex-col gap-3">
              <div className="text-xs text-muted">
                Document Type: <span className="font-bold text-primary uppercase">{exportData.type}</span>
              </div>
              <div className="text-xs text-muted">
                Items to export: <span className="font-bold text-primary">{exportData.rows.length}</span>
              </div>
            </div>
          </div>
        </div>
    </Drawer>
  );
};
