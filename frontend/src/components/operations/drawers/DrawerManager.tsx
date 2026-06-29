import React from 'react';
import { useOperationsDrawer } from './OperationsDrawerContext';
import { DepositDrawer } from './DepositDrawer';
import { WithdrawalDrawer } from './WithdrawalDrawer';
import { BulkOperationDrawer } from './BulkOperationDrawer';
import { InternalTransferDrawer } from './InternalTransferDrawer';
import { ExternalLoanDrawer } from './ExternalLoanDrawer';
import { RecoveryDrawer } from './RecoveryDrawer';
import { PresetDrawer } from './PresetDrawer';
import { BatchDrawer } from './BatchDrawer';
import { AddStudentDrawer } from '../../students/StudentDrawers';
import { PrintExportDrawer } from '../../ui/PrintExportDrawer';
import { useUIStore } from '../../../store/useUIStore';

export const DrawerManager: React.FC = () => {
  const { activeDrawer, closeDrawer, drawerData } = useOperationsDrawer();
  const { activeModal, closeAll } = useUIStore();

  const currentDrawer = activeDrawer || activeModal;
  const close = activeDrawer ? closeDrawer : closeAll;

  if (!currentDrawer) return null;

  switch (currentDrawer) {
    case 'deposit': return <DepositDrawer onClose={close} initialStudentId={drawerData?.studentId} />;
    case 'withdrawal': return <WithdrawalDrawer onClose={close} initialStudentId={drawerData?.studentId} />;
    case 'bulk': return <BulkOperationDrawer onClose={close} />;
    case 'internal': return <InternalTransferDrawer onClose={close} />;
    case 'external': return <ExternalLoanDrawer onClose={close} initialBorrowerId={drawerData?.studentId} />;
    case 'recovery': return <RecoveryDrawer onClose={close} initialBorrowerId={drawerData?.studentId} />;
    case 'preset': return <PresetDrawer onClose={close} />;
    case 'batch': return <BatchDrawer onClose={close} />;
    case 'addStudent': return <AddStudentDrawer onClose={close} />;
    case 'printExport': return <PrintExportDrawer />;
    default: return null;
  }
};
