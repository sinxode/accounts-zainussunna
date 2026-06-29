import React from 'react';
import { StatCard } from '../ui/StatCard';
import { 
  Users, 
  UserRoundCheck, 
  Link, 
  Star 
} from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { useQuery } from '@tanstack/react-query';
import { batchService } from '../../lib/services';
import { Skeleton } from '../ui/Skeleton';

export const BatchDashboard: React.FC = () => {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.list()
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

  const totalBatches = batches?.length || 0;
  const studentsAssigned = batches?.reduce((acc, b) => acc + (b.members?.[0]?.count || 0), 0) || 0;
  const favoriteBatches = batches?.filter(b => b.is_favorite).length || 0;

  return (
    <div className={styles.kpiGrid}>
      <StatCard 
        label="Total Batches" 
        value={totalBatches.toString()} 
        icon={<Users size={24} />} 
        variant="primary" 
      />
      <StatCard 
        label="Students Assigned" 
        value={studentsAssigned.toString()} 
        icon={<UserRoundCheck size={24} />} 
        variant="success" 
      />
      <StatCard 
        label="Linked Presets" 
        value="0 Presets" 
        icon={<Link size={24} />} 
        variant="info" 
      />
      <StatCard 
        label="Favorite Batches" 
        value={favoriteBatches.toString()} 
        icon={<Star size={24} />} 
        variant="warning" 
      />
    </div>
  );
};
