import React from 'react';
import { DepositDrawer } from './DepositDrawer';

export const WithdrawalDrawer: React.FC<{ onClose: () => void; initialStudentId?: string }> = ({ 
  onClose, 
  initialStudentId 
}) => {
  return (
    <DepositDrawer 
      onClose={onClose} 
      initialStudentId={initialStudentId} 
      initialType="withdrawal" 
    />
  );
};
