import React, { useState } from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import styles from './BatchManagement.module.scss';
import { BatchDashboard } from '../../components/batches/BatchDashboard';
import { QuickAccessStrip } from '../../components/batches/QuickAccessStrip';
import { BatchLibrary } from '../../components/batches/BatchLibrary';
import { BatchProfile } from '../../components/batches/BatchProfile';
import { FloatingActions } from '../../components/batches/FloatingActions';
import { BatchDrawer } from '../../components/operations/drawers/BatchDrawer';

export const BatchManagement: React.FC = () => {
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);

  const handleFABAction = (actionId: string) => {
    if (actionId === 'create') {
      setIsBatchDrawerOpen(true);
    }
  };

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button 
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => setIsBatchDrawerOpen(true)}
        >
          Create Batch
        </Button>
      </div>

      <div className={styles.batchesGrid}>
        <div className={styles.fullWidthSection}>
          <BatchDashboard />
        </div>

        <div className={styles.fullWidthSection}>
          <QuickAccessStrip />
        </div>

        <div className={styles.workspaceSection}>
          <div className={styles.libraryCol}>
            <BatchLibrary />
          </div>
          <div className={styles.profileCol}>
            <BatchProfile />
          </div>
        </div>
      </div>
      
      <FloatingActions onAction={handleFABAction} />

      {isBatchDrawerOpen && (
        <BatchDrawer 
          onClose={() => setIsBatchDrawerOpen(false)} 
        />
      )}
    </PageContainer>
  );
};
