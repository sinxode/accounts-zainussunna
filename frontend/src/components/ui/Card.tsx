import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import styles from './Card.module.scss';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'surface' | 'hero' | 'lime' | 'tint' | 'interactive' | 'default';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  headerMenu?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  style,
  variant = 'surface',
  padding = 'lg',
  title,
  subtitle,
  headerAction,
  headerMenu,
  footer,
  onClick,
  animate = false
}) => {
  const Component = animate ? motion.div : 'div';
  const effectiveVariant = variant === 'default' ? 'surface' : variant;
  const hasHeader = title || subtitle || headerAction || headerMenu;
  
  return (
    <Component
      style={style}
      className={clsx(
        styles.card,
        styles[effectiveVariant],
        styles[`padding-${padding}`],
        onClick && styles.clickable,
        className
      )}
      onClick={onClick}
      {...(animate && {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }
      })}
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            {title && (typeof title === 'string' ? <h2 className={styles.title}>{title}</h2> : title)}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {(headerAction || headerMenu) && (
            <div className={styles.headerRight}>
              {headerAction}
              {headerMenu}
            </div>
          )}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </Component>
  );
};
