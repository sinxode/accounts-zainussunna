import React from 'react';
import { BatchCard } from './BatchCard';
import { UsersRound, Loader2 } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { useQuery } from '@tanstack/react-query';
import { batchService } from '../../lib/services';
import { formatRelativeTime } from '../../lib/utils';

export const BatchLibrary: React.FC = () => {
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.list()
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading batches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-danger">
        <p>Error loading batches. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={styles.batchLibrary}>
      <div className={styles.libraryHeader}>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <UsersRound className="text-primary" /> Batch Library
        </h3>
        <span className="text-sm text-muted">All available student groups.</span>
      </div>
      
      <div className={styles.libraryGrid}>
        {batches && batches.length > 0 ? (
          batches.map(batch => (
            <BatchCard 
              key={batch.id} 
              id={batch.id}
              name={batch.name}
              description={batch.description || 'No description provided.'}
              studentCount={batch.members?.[0]?.count || 0}
              lastUsed={formatRelativeTime(batch.created_at)}
              isFavorite={batch.is_favorite}
            />
          ))
        ) : (
          <div className="p-12 text-center text-muted border-2 border-dashed border-border rounded-xl">
            <p>No batches found. Create your first batch to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
