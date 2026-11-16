import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, FileSpreadsheet, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import styles from './ExportMenu.module.scss';

export interface ExportMenuProps {
  onExportCSV?: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
  onExportPDF?: () => void | Promise<void>;
  onOpenDrawer?: () => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onOpenDrawer,
  disabled = false,
  label = 'Export',
  size = 'sm',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = async (action?: () => void | Promise<void>) => {
    if (!action || isExporting) return;
    try {
      setIsExporting(true);
      await action();
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={clsx(styles.wrapper, className)} ref={menuRef}>
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(styles.triggerBtn, styles[size], isOpen && styles.active)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={size === 'sm' ? 13 : 15} className={styles.icon} />
        <span className={styles.label}>{isExporting ? 'Exporting...' : label}</span>
        <ChevronDown size={12} className={clsx(styles.chevron, isOpen && styles.chevronRotated)} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.menuPopover}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            <div className={styles.menuHeader}>
              <span>Export Format</span>
            </div>
            <div className={styles.menuItems}>
              {onExportExcel && (
                <button
                  type="button"
                  onClick={() => handleAction(onExportExcel)}
                  className={styles.menuItem}
                >
                  <FileSpreadsheet size={14} className={styles.excelIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.itemTitle}>Excel Spreadsheet</span>
                    <span className={styles.itemExt}>.xlsx</span>
                  </div>
                </button>
              )}

              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => handleAction(onExportCSV)}
                  className={styles.menuItem}
                >
                  <Table size={14} className={styles.csvIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.itemTitle}>CSV Spreadsheet</span>
                    <span className={styles.itemExt}>.csv (UTF-8)</span>
                  </div>
                </button>
              )}

              {onExportPDF && (
                <button
                  type="button"
                  onClick={() => handleAction(onExportPDF)}
                  className={styles.menuItem}
                >
                  <FileText size={14} className={styles.pdfIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.itemTitle}>Printable PDF</span>
                    <span className={styles.itemExt}>.pdf document</span>
                  </div>
                </button>
              )}

              {onOpenDrawer && (
                <>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenDrawer)}
                    className={styles.menuItem}
                  >
                    <SlidersHorizontal size={14} className={styles.drawerIcon} />
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>Institutional Export Drawer...</span>
                      <span className={styles.itemExt}>Full settings & verification</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
