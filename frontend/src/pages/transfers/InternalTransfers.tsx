import React from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, FileText, Download, Wallet, IndianRupee } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './InternalTransfers.module.scss';
import { TransferDashboard } from '../../components/transfers/TransferDashboard';
import { TransferExplorer } from '../../components/transfers/TransferExplorer';
import { ActivityFeed } from '../../components/transfers/ActivityFeed';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';

export const InternalTransfers: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();

  return (
    <PageContainer>
      <PageHeader 
        title="Internal Transfers" 
        subtitle="Student borrowing and repayment management."
        actions={
          <div className="flex gap-4 items-center">
            <Button 
              variant="soft" 
              icon={<FileText size={16} />}
              onClick={() => openDrawer('recovery')}
            >
              Record Repayment
            </Button>
            <Button 
              icon={<Plus size={16} />}
              onClick={() => openDrawer('internal')}
            >
              New Transfer
            </Button>
          </div>
        }
      />

      <div className={styles.transfersGrid}>
        <div className={styles.kpiSection}>
          <TransferDashboard />
        </div>

        <TransferExplorer />

        <div className={styles.bottomWorkspaceGrid}>
          <div className={styles.activitySection}>
            <ActivityFeed />
          </div>

          <div className={styles.actionsSection}>
            <Card padding="lg" className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <Wallet size={16} className="text-muted" /> Transfer Operations
                </h3>
              </div>
              <div className={styles.actionsGrid}>
                <div className={styles.actionCard} onClick={() => openDrawer('internal')}>
                  <div className={clsx(styles.actionIcon, styles.primary)}>
                    <Plus size={16} />
                  </div>
                  <div className={styles.actionTitle}>New Transfer</div>
                  <div className={styles.actionDesc}>Record a new borrowing transaction</div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('recovery')}>
                  <div className={clsx(styles.actionIcon, styles.success)}>
                    <IndianRupee size={16} />
                  </div>
                  <div className={styles.actionTitle}>Record Repayment</div>
                  <div className={styles.actionDesc}>Record full or partial repayments</div>
                </div>

                <div className={styles.actionCard}>
                  <div className={clsx(styles.actionIcon, styles.warning)}>
                    <Wallet size={16} />
                  </div>
                  <div className={styles.actionTitle}>Outstanding Center</div>
                  <div className={styles.actionDesc}>Inspect and sort active loan exposures</div>
                </div>

                <div className={styles.actionCard}>
                  <div className={clsx(styles.actionIcon, styles.neutral)}>
                    <Download size={16} />
                  </div>
                  <div className={styles.actionTitle}>Export List</div>
                  <div className={styles.actionDesc}>Download transfers ledger sheet</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

    </PageContainer>
  );
};
