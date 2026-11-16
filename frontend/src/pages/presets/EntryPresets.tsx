import React from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button 
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => openDrawer('preset')}
        >
          Create Preset
        </Button>
      </div>

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
