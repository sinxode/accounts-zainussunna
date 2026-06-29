import React from 'react';
import { BatchCard } from './BatchCard';
import { Star, Loader2 } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { useQuery } from '@tanstack/react-query';
import { batchService } from '../../lib/services';
import { formatRelativeTime } from '../../lib/utils';

export const QuickAccessStrip: React.FC = () => {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.list()
  });

  const favorites = batches?.filter(b => b.is_favorite) || [];

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
        {favorites.map(batch => (
          <BatchCard 
            key={batch.id}
            id={batch.id}
            name={batch.name}
            description={batch.description || ''}
            studentCount={batch.members?.[0]?.count || 0}
            lastUsed={formatRelativeTime(batch.created_at)}
            isFavorite={true}
          />
        ))}
      </div>
    </div>
  );
};
