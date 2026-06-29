import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import styles from './PageContainer.module.scss';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  animate = true
}) => {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      className={clsx(styles.container, className)}
      {...(animate && {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
      })}
    >
      {children}
    </Component>
  );
};
