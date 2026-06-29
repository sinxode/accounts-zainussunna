import React from 'react';
import { PresetCard } from './PresetCard';
import { LayoutTemplate, Loader2 } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { useQuery } from '@tanstack/react-query';
import { presetService } from '../../lib/services';
import { formatRelativeTime } from '../../lib/utils';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';

export const PresetLibrary: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();
  
  const { data: presets, isLoading, error } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetService.list()
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading presets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-danger">
        <p>Error loading presets. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={styles.presetLibrary}>
      <div className={styles.libraryHeader}>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <LayoutTemplate className="text-primary" /> Preset Library
        </h3>
        <span className="text-sm text-muted">All available operation configurations.</span>
      </div>
      
      <div className={styles.libraryGrid}>
        {presets && presets.length > 0 ? (
          presets.map(preset => (
            <PresetCard 
              key={preset.id} 
              id={preset.id}
              name={preset.name}
              description={preset.description || 'No description provided.'}
              category={preset.transaction_type}
              lastUsed={formatRelativeTime(preset.created_at)}
              isFavorite={preset.is_favorite}
              onRun={() => openDrawer('bulk', { preset })}
              onEdit={() => openDrawer('bulk', { preset, mode: 'edit' })}
            />
          ))
        ) : (
          <div className="p-12 text-center text-muted border-2 border-dashed border-border rounded-xl">
            <p>No presets found. Create your first preset to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
