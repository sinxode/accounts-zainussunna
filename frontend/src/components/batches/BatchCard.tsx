import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Users, Play, Edit, Star } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/useUIStore';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';

interface BatchCardProps {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  lastUsed: string;
  isFavorite?: boolean;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  id,
  name,
  description,
  studentCount,
  lastUsed,
  isFavorite
}) => {
  const { selectedBatchId, setSelectedBatchId } = useUIStore();
  const { openDrawer } = useOperationsDrawer();
  const isSelected = selectedBatchId === id;

  return (
    <Card 
      padding="md" 
      className={clsx(
        styles.batchCard, 
        isFavorite && styles.favoriteCard,
        isSelected && styles.selectedCard
      )}
      onClick={() => setSelectedBatchId(id)}
    >
      <div className={styles.cardHeader}>
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className={styles.batchName}>{name}</h4>
              {isFavorite && <Star size={12} className="text-warning fill-warning" />}
            </div>
            <p className={styles.batchDesc}>{description}</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          <span className={clsx(styles.metaItem, styles.studentBadge)}>
            <Users size={12} /> {studentCount} Students
          </span>
          <span className={clsx(styles.metaItem, styles.timeBadge)}>
            Created {lastUsed}
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <Button 
          variant="primary" 
          size="sm" 
          icon={<Play size={13} />} 
          className="flex-grow"
          onClick={(e) => {
            e.stopPropagation();
            openDrawer('bulk', { batchId: id });
          }}
        >
          Load Batch
        </Button>
        <Button 
          variant="soft" 
          size="sm" 
          icon={<Edit size={13} />} 
          onClick={(e) => {
            e.stopPropagation();
            openDrawer('batch', { batchId: id, mode: 'edit' });
          }}
        >
          Edit
        </Button>
      </div>
    </Card>
  );
};
