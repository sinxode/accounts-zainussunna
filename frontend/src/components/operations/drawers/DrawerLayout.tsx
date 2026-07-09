import React from 'react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Trash2 } from 'lucide-react';

interface DrawerLayoutProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  isOpen?: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DrawerLayout: React.FC<DrawerLayoutProps> = ({ 
  title, 
  icon, 
  subtitle, 
  isOpen = true,
  onClose, 
  onClear,
  children, 
  footer
}) => {
  const footerContent = (
    <div className="flex w-full items-center gap-2">
      {onClear && (
        <Button 
          variant="danger" 
          onClick={onClear} 
          icon={<Trash2 size={16} />}
          className="flex items-center justify-center shrink-0"
        />
      )}
      <div className="flex w-full gap-2 items-center">
        {footer ? (
          footer
        ) : (
          <Button variant="primary" className="flex-1">Submit</Button>
        )}
      </div>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}>
            {icon}
          </div>
          {title}
        </span>
      }
      subtitle={subtitle}
      footer={footerContent}
      size="xl"
    >
      {children}
    </Drawer>
  );
};
