import React from 'react';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './FilterBar.module.scss';

export interface QuickFilter {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}

export interface FilterChip {
  id: string;
  label: string;
  valueDisplay: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  quickFilters?: QuickFilter[];
  chips?: FilterChip[];
  onOpenAdvanced?: () => void;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  totalCount?: number;
  filteredCount?: number;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  quickFilters = [],
  chips = [],
  onOpenAdvanced,
  onClearAll,
  hasActiveFilters = false,
  totalCount,
  filteredCount,
  rightSlot,
  className,
}) => {
  return (
    <div className={clsx(styles.filterBarContainer, className)}>
      <div className={styles.mainRow}>
        {/* Search input with quick clear */}
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Quick inline filter dropdowns */}
        <div className={styles.quickFilters}>
          {quickFilters.map((qf) => (
            <div key={qf.id} className={styles.selectWrapper}>
              <select
                className={clsx(styles.filterSelect, qf.value !== 'all' && qf.value !== '' && styles.filterSelectActive)}
                value={qf.value}
                onChange={(e) => qf.onChange(e.target.value)}
                aria-label={qf.label}
              >
                {qf.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Advanced filter toggle button */}
          {onOpenAdvanced && (
            <button
              type="button"
              onClick={onOpenAdvanced}
              className={clsx(styles.advancedFilterBtn, hasActiveFilters && styles.hasFilters)}
              title="Advanced filters"
            >
              <SlidersHorizontal size={13} />
              <span className={styles.filterBtnLabel}>Filters</span>
              {hasActiveFilters && <span className={styles.activeDot} />}
            </button>
          )}

          {/* Reset all button if filters are active */}
          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className={styles.resetBtn}
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span className={styles.resetLabel}>Reset</span>
            </button>
          )}
        </div>

        {/* Right side utility slot (e.g., ExportMenu, Result counts) */}
        {(rightSlot || (filteredCount !== undefined && totalCount !== undefined)) && (
          <div className={styles.rightActions}>
            {filteredCount !== undefined && totalCount !== undefined && (
              <span className={styles.countBadge}>
                {filteredCount === totalCount ? (
                  <span>{totalCount} total</span>
                ) : (
                  <span>
                    <strong>{filteredCount}</strong> of {totalCount}
                  </span>
                )}
              </span>
            )}
            {rightSlot}
          </div>
        )}
      </div>

      {/* Active filter chips row */}
      {chips.length > 0 && (
        <div className={styles.chipsRow}>
          <span className={styles.chipsLabel}>Active:</span>
          <div className={styles.chipsScroll}>
            {chips.map((chip) => (
              <span key={chip.id} className={styles.chip}>
                <span className={styles.chipKey}>{chip.label}:</span>
                <span className={styles.chipVal}>{chip.valueDisplay}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {onClearAll && (
              <button type="button" className={styles.clearChipsBtn} onClick={onClearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
