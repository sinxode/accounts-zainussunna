import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Play, UsersRound, Loader2 } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { useUIStore } from '../../store/useUIStore';
import { useQuery } from '@tanstack/react-query';
import { batchService } from '../../lib/services';
import { formatDate } from '../../lib/utils';

export const BatchProfile: React.FC = () => {
  const { selectedBatchId } = useUIStore();

  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.list(),
    enabled: !!selectedBatchId
  });

  const selectedBatch = batches?.find(b => b.id === selectedBatchId);

  if (!selectedBatchId) {
    return (
      <div className={styles.stickyContainer}>
        <Card padding="lg" className="flex flex-col items-center justify-center text-center p-12 text-muted h-[400px]">
          <UsersRound size={48} className="mb-4 opacity-20" />
          <p className="font-medium">No Batch Selected</p>
          <p className="text-sm">Select a batch from the library to view details and health overview.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.stickyContainer}>
        <Card padding="lg" className="flex flex-col items-center justify-center p-12 text-muted h-[400px]">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading batch details...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.stickyContainer}>
      <Card padding="lg" className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-primary">{selectedBatch?.name}</h3>
            <Badge variant="primary" size="sm">Active</Badge>
          </div>
          <p className="text-sm text-muted">{selectedBatch?.description || 'No description provided.'}</p>
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.profileItem}>
            <span className={styles.profileLabel}>Category</span>
            <span className={styles.profileValue}>Custom</span>
          </div>
          <div className={styles.profileItem}>
            <span className={styles.profileLabel}>Students</span>
            <span className={styles.profileValue}>{selectedBatch?.members?.[0]?.count || 0} Members</span>
          </div>
          <div className={styles.profileItem}>
            <span className={styles.profileLabel}>Created</span>
            <span className={styles.profileValue}>{formatDate(selectedBatch?.created_at)}</span>
          </div>
          <div className={styles.profileItem}>
            <span className={styles.profileLabel}>Last Used</span>
            <span className={styles.profileValue}>N/A</span>
          </div>
        </div>

        <div className={styles.studentOverviewSection}>
          <h4 className={styles.sectionTitleSmall}>Student Health Overview</h4>
          <div className={styles.overviewList}>
            <div className={styles.overviewRow}>
              <span className={styles.overviewKey}>Healthy Balances</span>
              <span className="text-sm font-bold text-success">Calculated from Directory</span>
            </div>
          </div>
        </div>

        <div className={styles.linkedItemsSection}>
          <h4 className={styles.sectionTitleSmall}>Linked Presets</h4>
          <div className={styles.presetTags}>
            <Badge variant="neutral">None</Badge>
          </div>
        </div>

        <div className={styles.profileActions}>
          <Button variant="primary" icon={<Play size={16} />} className="w-full justify-center">Load in Operations</Button>
        </div>
      </Card>
    </div>
  );
};
