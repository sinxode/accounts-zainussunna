import React from 'react';
import { clsx } from 'clsx';
import styles from './DataTable.module.scss';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
  responsiveHidden?: 'mobile' | 'tablet' | 'none' | string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  renderCard?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading,
  renderCard
}: DataTableProps<T>) {
  const showCards = data.length > 0;

  const defaultRenderCard = (item: T) => {
    return (
      <div key={item.id} className={styles.mobileCard} onClick={() => onRowClick?.(item)}>
        {columns.map((col, i) => {
          // If it is the last column and has no header (usually actions), render as full width action row at bottom
          if (!col.header && i === columns.length - 1) {
            return (
              <div key={i} className={styles.mobileCardAction} onClick={(e) => e.stopPropagation()}>
                {typeof col.accessor === 'function' 
                  ? col.accessor(item) 
                  : (item[col.accessor] as React.ReactNode)}
              </div>
            );
          }
          if (!col.header) return null;
          return (
            <div key={i} className={styles.mobileCardRow}>
              <span className={styles.mobileCardLabel}>{col.header}</span>
              <span className={styles.mobileCardValue}>
                {typeof col.accessor === 'function' 
                  ? col.accessor(item) 
                  : (item[col.accessor] as React.ReactNode)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th 
                key={i} 
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={clsx(
                  col.responsiveHidden === 'mobile' && styles.hideOnMobile,
                  col.responsiveHidden === 'tablet' && styles.hideOnTablet
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={styles.skeletonRow}>
                {columns.map((col, j) => (
                  <td 
                    key={j}
                    style={{ width: col.width }}
                    className={clsx(
                      col.responsiveHidden === 'mobile' && styles.hideOnMobile,
                      col.responsiveHidden === 'tablet' && styles.hideOnTablet
                    )}
                  >
                    <div className={styles.skeleton} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                No records found
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={clsx(onRowClick && styles.clickable)}
              >
                {columns.map((col, j) => (
                  <td 
                    key={j}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className={clsx(
                      col.responsiveHidden === 'mobile' && styles.hideOnMobile,
                      col.responsiveHidden === 'tablet' && styles.hideOnTablet
                    )}
                  >
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showCards && (
        <div className={styles.cardView}>
          {data.map((item) => (
            <React.Fragment key={item.id}>
              {renderCard ? renderCard(item) : defaultRenderCard(item)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
