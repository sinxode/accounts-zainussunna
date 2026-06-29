import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Edit, Star } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/useUIStore';

interface PresetCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  lastUsed: string;
  isFavorite?: boolean;
  onRun?: () => void;
  onEdit?: () => void;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  id,
  name,
  description,
  category,
  lastUsed,
  isFavorite,
  onRun,
  onEdit
}) => {
  const { selectedPresetId, setSelectedPresetId } = useUIStore();
  const isSelected = selectedPresetId === id;

  // Format type nicely
  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Card 
      padding="md" 
      className={clsx(
        styles.presetCard, 
        isFavorite && styles.favoriteCard,
        isSelected && styles.selectedCard
      )}
      onClick={() => setSelectedPresetId(id)}
    >
      <div className={styles.cardHeader}>
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className={styles.presetName}>{name}</h4>
              {isFavorite && <Star size={12} className="text-warning fill-warning" />}
            </div>
            <p className={styles.presetDesc}>{description}</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          <span className={clsx(styles.metaItem, styles.categoryBadge)}>
            {formattedCategory}
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
          onClick={(e) => { e.stopPropagation(); onRun?.(); }} 
          className="flex-grow"
        >
          Run Preset
        </Button>
        <Button 
          variant="soft" 
          size="sm" 
          icon={<Edit size={13} />} 
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }} 
        >
          Edit
        </Button>
      </div>
    </Card>
  );
};
