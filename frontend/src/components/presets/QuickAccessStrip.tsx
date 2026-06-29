import React from 'react';
import { PresetCard } from './PresetCard';
import { Star, Loader2 } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { useQuery } from '@tanstack/react-query';
import { presetService } from '../../lib/services';
import { formatRelativeTime } from '../../lib/utils';

export const QuickAccessStrip: React.FC = () => {
  const { data: presets, isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetService.list()
  });

  const favorites = presets?.filter(p => p.is_favorite) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Loading favorites...</span>
      </div>
    );
  }

  if (favorites.length === 0) {
    return null; // Don't show the strip if no favorites exist
  }

  return (
    <div className={styles.quickAccessStrip}>
      <div className={styles.stripHeader}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Star className="text-warning fill-warning" /> Quick Access Favorites
        </h3>
      </div>
      <div className={styles.stripGrid}>
        {favorites.map(preset => (
          <PresetCard 
            key={preset.id}
            id={preset.id}
            name={preset.name}
            description={preset.description || ''}
            category={preset.transaction_type}
            lastUsed={formatRelativeTime(preset.created_at)}
            isFavorite={true}
          />
        ))}
      </div>
    </div>
  );
};
