import React from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RotateCcw, AlertTriangle, Layers, IndianRupee } from 'lucide-react';
import styles from './StudentFilterDrawer.module.scss';
import { clsx } from 'clsx';

export interface StudentFilterState {
  status: string; // 'all' | 'active' | 'archived'
  health: string; // 'all' | 'positive' | 'negative' | 'zero' | 'under_200' | 'under_500' | 'custom'
  category: string; // 'all' | 'hifz' | 'da_wa' | 'general'
  customMin: string;
  customMax: string;
}

interface StudentFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: StudentFilterState;
  onChange: (filters: StudentFilterState) => void;
  onReset: () => void;
  matchingCount: number;
  totalCount: number;
  availableCategories: string[];
}

export const StudentFilterDrawer: React.FC<StudentFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  matchingCount,
  totalCount,
  availableCategories = []
}) => {
  const update = (partial: Partial<StudentFilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const categoryOptions = Array.from(new Set(['hifz', "da'wa", 'general', ...availableCategories.map(c => c.toLowerCase())]));

  const isFiltered = 
    filters.status !== 'all' || 
    filters.health !== 'all' || 
    filters.category !== 'all' || 
    Boolean(filters.customMin) || 
    Boolean(filters.customMax);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Students"
      subtitle="Refine directory view and targeted export datasets."
      size="md"
      footer={
        <div className={styles.footerRow}>
          <Button 
            variant="ghost" 
            onClick={onReset}
            disabled={!isFiltered}
            icon={<RotateCcw size={14} />}
          >
            Reset All
          </Button>
          <Button 
            variant="primary" 
            onClick={onClose}
          >
            Apply ({matchingCount} Students)
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {/* Real-time Match Banner */}
        <div className={styles.matchBanner}>
          <div className={styles.matchText}>
            <span className={styles.matchLabel}>Matching Students</span>
            <span className={styles.matchCount}>
              {matchingCount} <span className={styles.matchTotal}>of {totalCount} total</span>
            </span>
          </div>
          {isFiltered ? (
            <Badge variant="active" size="sm">
              Filters Active
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Showing All
            </Badge>
          )}
        </div>

        {/* 1. Balance & Health Thresholds */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleWithIcon}>
              <IndianRupee size={15} className={styles.secIcon} />
              <span className={styles.sectionTitle}>Balance & Fund Standing</span>
            </div>
            <span className={styles.sectionHint}>Filter by balance threshold</span>
          </div>

          <div className={styles.chipGrid}>
            <button
              type="button"
              className={clsx(styles.chip, filters.health === 'all' && !filters.customMax && styles.activeChip)}
              onClick={() => update({ health: 'all', customMin: '', customMax: '' })}
            >
              All Balances
            </button>

            <button
              type="button"
              className={clsx(styles.chip, styles.alertChip, filters.health === 'under_200' && styles.activeChip)}
              onClick={() => update({ health: 'under_200', customMin: '', customMax: '200' })}
            >
              <AlertTriangle size={13} />
              Balance ≤ ₹200 (Low Funds)
            </button>

            <button
              type="button"
              className={clsx(styles.chip, filters.health === 'under_500' && styles.activeChip)}
              onClick={() => update({ health: 'under_500', customMin: '', customMax: '500' })}
            >
              Balance ≤ ₹500
            </button>

            <button
              type="button"
              className={clsx(styles.chip, styles.dangerChip, filters.health === 'negative' && styles.activeChip)}
              onClick={() => update({ health: 'negative', customMin: '', customMax: '' })}
            >
              Overdrawn Accounts (&lt; ₹0)
            </button>

            <button
              type="button"
              className={clsx(styles.chip, filters.health === 'positive' && styles.activeChip)}
              onClick={() => update({ health: 'positive', customMin: '', customMax: '' })}
            >
              Positive Balances (&gt; ₹0)
            </button>

            <button
              type="button"
              className={clsx(styles.chip, filters.health === 'zero' && styles.activeChip)}
              onClick={() => update({ health: 'zero', customMin: '', customMax: '' })}
            >
              Zero Balance (= ₹0)
            </button>
          </div>

          {/* Custom Balance Range Inputs */}
          <div className={styles.customRangeBox}>
            <span className={styles.rangeTitle}>Or Custom Balance Range (₹):</span>
            <div className={styles.rangeInputs}>
              <div className={styles.inputGroup}>
                <span className={styles.inputPrefix}>Min ₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.customMin}
                  onChange={(e) => update({ customMin: e.target.value, health: 'custom' })}
                  className={styles.rangeInput}
                />
              </div>
              <span className={styles.rangeTo}>to</span>
              <div className={styles.inputGroup}>
                <span className={styles.inputPrefix}>Max ₹</span>
                <input
                  type="number"
                  placeholder="200"
                  value={filters.customMax}
                  onChange={(e) => update({ customMax: e.target.value, health: 'custom' })}
                  className={styles.rangeInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Category / Sheet Names */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleWithIcon}>
              <Layers size={15} className={styles.secIcon} />
              <span className={styles.sectionTitle}>Category & Sheet Division</span>
            </div>
            <span className={styles.sectionHint}>Department grouping</span>
          </div>

          <div className={styles.chipGrid}>
            <button
              type="button"
              className={clsx(styles.chip, filters.category === 'all' && styles.activeChip)}
              onClick={() => update({ category: 'all' })}
            >
              All Categories
            </button>

            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                className={clsx(styles.chip, filters.category.toLowerCase() === cat && styles.activeChip)}
                onClick={() => update({ category: cat })}
                style={{ textTransform: 'capitalize' }}
              >
                {cat === 'hifz' ? 'Hifz Division' : cat === "da'wa" ? "Da'wa Division" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Account Status */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Account Status</span>
          </div>

          <div className={styles.chipGrid}>
            <button
              type="button"
              className={clsx(styles.chip, filters.status === 'all' && styles.activeChip)}
              onClick={() => update({ status: 'all' })}
            >
              All Statuses
            </button>

            <button
              type="button"
              className={clsx(styles.chip, filters.status === 'active' && styles.activeChip)}
              onClick={() => update({ status: 'active' })}
            >
              Active Only
            </button>

            <button
              type="button"
              className={clsx(styles.chip, filters.status === 'archived' && styles.activeChip)}
              onClick={() => update({ status: 'archived' })}
            >
              Archived Only
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
