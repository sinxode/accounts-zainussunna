import React from 'react';
import { LayoutTemplate, Zap } from 'lucide-react';
import styles from '../../pages/operations/OperationsCenter.module.scss';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';
import { useOperationsDrawer } from './drawers/OperationsDrawerContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { presetService } from '../../lib/services';

export const RecentPresets: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();
  const navigate = useNavigate();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: presetService.list
  });

  return (
    <Card padding="none">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <LayoutTemplate size={20} className="text-primary" />
          Quick Presets
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/presets')}>Manage</Button>
      </div>
      
      <div className={styles.opsList}>
        {isLoading ? (
          <div className="p-8 text-center text-muted">Loading presets...</div>
        ) : presets.length > 0 ? (
          presets.slice(0, 3).map(preset => (
            <div key={preset.id} className={styles.opItem}>
              <div className={styles.opInfo}>
                <div className={clsx(styles.opIcon, styles.quick)}>
                  <Zap size={20} />
                </div>
                <div className={styles.opDetails}>
                  <span className={styles.opTitle}>{preset.name}</span>
                  <span className={styles.opSub}>{preset.description}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="soft" 
                  size="sm" 
                  onClick={() => openDrawer('bulk', { preset })}
                >
                  Run
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted p-8 text-sm">
            No presets found.
          </div>
        )}
      </div>
    </Card>
  );
};
