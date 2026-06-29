import React from 'react';
import { InternalTransferDrawer } from '../operations/drawers/InternalTransferDrawer';

interface TransferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferDrawer: React.FC<TransferDrawerProps> = ({ isOpen, onClose }) => {
  return <InternalTransferDrawer isOpen={isOpen} onClose={onClose} />;
};
