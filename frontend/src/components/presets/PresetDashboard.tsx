import React from 'react';
import { StatCard } from '../ui/StatCard';
import { 
  LayoutTemplate, 
  BadgeCheck, 
  Star, 
  CalendarDays 
} from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { useQuery } from '@tanstack/react-query';
import { presetService } from '../../lib/services';
import { Skeleton } from '../ui/Skeleton';

export const PresetDashboard: React.FC = () => {
  const { data: presets, isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetService.list()
  });

  if (isLoading) {
    return (
      <div className={styles.kpiGrid}>
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} height="100px" borderRadius="16px" />
        ))}
      </div>
    );
  }

  const totalPresets = presets?.length || 0;
  const activePresets = presets?.length || 0; // Assuming all returned are active for now
  const favoritePresets = presets?.filter(p => p.is_favorite).length || 0;

  return (
    <div className={styles.kpiGrid}>
      <StatCard 
        label="Total Presets" 
        value={totalPresets.toString()} 
        icon={<LayoutTemplate size={24} />} 
        variant="primary" 
      />
      <StatCard 
        label="Active Presets" 
        value={activePresets.toString()} 
        icon={<BadgeCheck size={24} />} 
        variant="success" 
      />
      <StatCard 
        label="Favorite Presets" 
        value={favoritePresets.toString()} 
        icon={<Star size={24} />} 
        variant="warning" 
      />
      <StatCard 
        label="Used This Month" 
        value="0" 
        icon={<CalendarDays size={24} />} 
        variant="neutral" 
      />
    </div>
  );
};
