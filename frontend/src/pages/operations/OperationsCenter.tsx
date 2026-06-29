import React from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import styles from './OperationsCenter.module.scss';
import { TodaySummary } from '../../components/operations/TodaySummary';
import { QuickActions } from '../../components/operations/QuickActions';
import { RecentOperations } from '../../components/operations/RecentOperations';
import { RecentPresets } from '../../components/operations/RecentPresets';
import { TodayTasks } from '../../components/operations/TodayTasks';

export const OperationsCenter: React.FC = () => {
  return (
    <PageContainer>
      <div className={styles.homeScreenLayout}>
        <PageHeader 
          title="Operations Center" 
          subtitle="Financial Operations Hub for student deposits, withdrawals, bulk ledger entries, and templates."
        />
        
        <TodaySummary />
        
        <QuickActions />
        
        <div className={styles.twoColumnGrid}>
          <RecentOperations />
          <div className={styles.sideColumn}>
            <TodayTasks />
            <div className={styles.presetsWrapper}>
              <RecentPresets />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
