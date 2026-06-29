import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Settings2, Save } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { StudentSelectionEngine } from './StudentSelectionEngine';

interface BatchBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchBuilder: React.FC<BatchBuilderProps> = ({ isOpen, onClose }) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <Settings2 className="text-primary" /> Create Batch
        </span>
      }
      subtitle="Configure a new reusable student group."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="soft">Save Draft</Button>
            <Button icon={<Save size={16} />}>Save Batch</Button>
            <Button variant="primary" icon={<Settings2 size={16} />} onClick={onClose}>Save & Use</Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <section>
          <h3 className={styles.sectionTitle}>1. Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input label="Batch Name" placeholder="e.g. Zakaath Students" />
            <Input label="Category" placeholder="e.g. Zakaath" />
            <div className="col-span-2">
              <Input label="Description" placeholder="What is the purpose of this batch?" />
            </div>
            <div className="col-span-2">
              <Input label="Tags (comma separated)" placeholder="e.g. zakaath, monthly, approved" />
            </div>
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>2. Student Selection Engine</h3>
          <p className="text-xs text-muted mt-1 mb-4">Select the students that belong to this batch.</p>
          <StudentSelectionEngine />
        </section>

        <section>
          <h3 className={styles.sectionTitle}>3. Live Preview</h3>
          <div className="p-4 bg-tertiary rounded-xl border border-border mt-4">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-muted">Total Students:</div>
              <div className="font-bold text-primary">0 Selected</div>
              <div className="text-muted">Linked Presets:</div>
              <div className="font-bold">None (New Batch)</div>
              <div className="text-muted">Estimated Usage:</div>
              <div className="font-bold">N/A</div>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};
