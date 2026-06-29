import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IndianRupee, Save } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import summaryStyles from '../ui/SummaryNote.module.scss';
import { Badge } from '../ui/Badge';

interface RepaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RepaymentDrawer: React.FC<RepaymentDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <IndianRupee className="text-success" /> Record Repayment
        </span>
      }
      subtitle="Process a partial or full repayment for a transfer."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={<Save size={16} />} onClick={onClose}>Record Repayment</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h3 className={styles.sectionTitle}>Repayment Details</h3>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Input label="Transfer ID" placeholder="e.g. TRF-102" />
            <Input label="Repayment Amount" type="number" placeholder="₹0.00" />
            <Input label="Date" type="date" />
            <Input label="Notes" placeholder="Additional details..." />
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Live Preview</h3>
          <div className={summaryStyles.summaryNote}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Outstanding Before</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-sm text-success mb-2">
              <span className="text-muted">Repayment Amount</span>
              <span className="font-bold">-₹0</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="font-bold text-primary">Outstanding After</span>
              <span className="font-bold text-primary">₹0</span>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm font-medium">Predicted Status</span>
              <Badge variant="neutral">Pending</Badge>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};
