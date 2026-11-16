import React from 'react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';

interface DrawerLayoutProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  isOpen?: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DrawerLayout: React.FC<DrawerLayoutProps> = ({ 
  title, 
  icon, 
  subtitle: _subtitle, 
  isOpen = true,
  onClose, 
  onClear: _onClear,
  children, 
  footer,
  size = 'md'
}) => {
  const footerContent = (
    <div style={{ display: 'flex', width: '100%', gap: '8px', alignItems: 'center' }}>
      {footer ? (
        footer
      ) : (
        <Button variant="primary" fullWidth>Submit</Button>
      )}
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-subtle)',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{title}</span>
        </div>
      }
      footer={footerContent}
      size={size}
    >
      {children}
    </Drawer>
  );
};
