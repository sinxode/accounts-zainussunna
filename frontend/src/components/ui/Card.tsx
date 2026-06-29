import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import styles from './Card.module.scss';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
  animate = true
}) => {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      className={clsx(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className
      )}
      onClick={onClick}
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
      })}
    >
      {children}
    </Component>
  );
};
