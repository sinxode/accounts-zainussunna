import React from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import styles from './EntryPresets.module.scss';
import { PresetDashboard } from '../../components/presets/PresetDashboard';
import { QuickAccessStrip } from '../../components/presets/QuickAccessStrip';
import { PresetLibrary } from '../../components/presets/PresetLibrary';
import { PresetDetails } from '../../components/presets/PresetDetails';
import { FloatingActions } from '../../components/presets/FloatingActions';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';

export const EntryPresets: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();

  return (
    <PageContainer>
      <PageHeader 
        title="Entry Presets" 
        subtitle="Reusable operation patterns for faster financial workflows."
        actions={
          <div className="flex gap-4 items-center">
            <Button 
              icon={<Plus size={16} />}
              onClick={() => openDrawer('preset')}
            >
              Create Preset
            </Button>
          </div>
        }
      />

      <div className={styles.presetsGrid}>
        <div className={styles.fullWidthSection}>
          <PresetDashboard />
        </div>

        <div className={styles.fullWidthSection}>
          <QuickAccessStrip />
        </div>

        <div className={styles.workspaceSection}>
          <div className={styles.libraryCol}>
            <PresetLibrary />
          </div>
          <div className={styles.detailsCol}>
            <PresetDetails />
          </div>
        </div>
      </div>
      
      <FloatingActions onAction={(actionId) => actionId === 'create' && openDrawer('preset')} />
    </PageContainer>
  );
};
