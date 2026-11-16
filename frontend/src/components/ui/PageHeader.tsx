import React from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import styles from './PageHeader.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title: _title,
  subtitle: _subtitle,
  badge: _badge,
  breadcrumbs,
  actions,
  className
}) => {
  // If no actions and no breadcrumbs, omit component entirely to remove duplicate page headings
  if (!actions && (!breadcrumbs || breadcrumbs.length === 0)) {
    return null;
  }

  return (
    <div className={clsx(styles.header, styles.minimalToolbar, className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className={styles.crumbDivider}>/</span>}
              {crumb.href ? (
                <Link to={crumb.href} className={styles.crumbLink}>{crumb.label}</Link>
              ) : (
                <span className={styles.crumbCurrent}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};
