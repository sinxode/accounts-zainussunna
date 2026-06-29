import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Play, Edit, LayoutTemplate, Loader2 } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { useUIStore } from '../../store/useUIStore';
import { useQuery } from '@tanstack/react-query';
import { presetService } from '../../lib/services';
import { formatDate, formatCurrency } from '../../lib/utils';

export const PresetDetails: React.FC = () => {
  const { selectedPresetId } = useUIStore();

  const { data: presets, isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetService.list(),
    enabled: !!selectedPresetId
  });

  const selectedPreset = presets?.find(p => p.id === selectedPresetId);

  if (!selectedPresetId) {
    return (
      <div className={styles.stickyContainer}>
        <Card padding="lg" className="flex flex-col items-center justify-center text-center p-12 text-muted h-[400px]">
          <LayoutTemplate size={48} className="mb-4 opacity-20" />
          <p className="font-medium">No Preset Selected</p>
          <p className="text-sm">Select a preset from the library to view configuration and run options.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.stickyContainer}>
        <Card padding="lg" className="flex flex-col items-center justify-center p-12 text-muted h-[400px]">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading preset details...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.stickyContainer}>
      <Card padding="lg" className={styles.detailsCard}>
        <div className={styles.detailsHeader}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-primary">{selectedPreset?.name}</h3>
            <Badge variant="primary" size="sm">Active</Badge>
          </div>
          <p className="text-sm text-muted">{selectedPreset?.description || 'No description provided.'}</p>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Category</span>
            <span className={styles.detailValue}>{selectedPreset?.transaction_type}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Usage</span>
            <span className={styles.detailValue}>0 times</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Created Date</span>
            <span className={styles.detailValue}>{formatDate(selectedPreset?.created_at)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Last Used</span>
            <span className={styles.detailValue}>N/A</span>
          </div>
        </div>

        <div className={styles.defaultValuesSection}>
          <h4 className={styles.sectionTitleSmall}>Default Configuration</h4>
          <div className={styles.defaultsList}>
            <div className={styles.defaultRow}>
              <span className={styles.defaultKey}>Batch</span>
              <span className={styles.defaultVal}>None Linked</span>
            </div>
            <div className={styles.defaultRow}>
              <span className={styles.defaultKey}>Amount</span>
              <span className={styles.defaultVal}>{selectedPreset?.amount ? formatCurrency(selectedPreset.amount) : '₹0'}</span>
            </div>
            <div className={styles.defaultRow}>
              <span className={styles.defaultKey}>Purpose</span>
              <span className={styles.defaultVal}>{selectedPreset?.purpose}</span>
            </div>
            <div className={styles.defaultRow}>
              <span className={styles.defaultKey}>Transaction Type</span>
              <span className={styles.defaultVal}>{selectedPreset?.transaction_type}</span>
            </div>
            <div className={styles.defaultRow}>
              <span className={styles.defaultKey}>Date</span>
              <span className="text-sm text-warning italic font-bold">Auto Generated</span>
            </div>
          </div>
        </div>

        <div className={styles.detailsActions}>
          <Button variant="primary" icon={<Play size={16} />} className="w-full justify-center">Run Preset</Button>
          <Button variant="soft" icon={<Edit size={16} />} className="w-full justify-center">Edit Configuration</Button>
        </div>
      </Card>
    </div>
  );
};
