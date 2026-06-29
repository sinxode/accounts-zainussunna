import React from 'react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { 
  Play, 
  Edit, 
  Copy, 
  Layers, 
  IndianRupee, 
  MessageSquare,
  Zap,
  ChevronRight,
  Activity,
  Calendar,
  Type
} from 'lucide-react';
import styles from './PresetDrawer.module.scss';
import { formatRelativeTime } from '../../../lib/utils';
import { useOperationsDrawer } from './OperationsDrawerContext';

interface PresetPreviewDrawerProps {
  onClose: () => void;
  preset: any;
}

export const PresetPreviewDrawer: React.FC<PresetPreviewDrawerProps> = ({ onClose, preset }) => {
  const { openDrawer } = useOperationsDrawer();
  
  if (!preset) return null;

  const config = preset.configuration || {};

  const handleLoad = () => {
    openDrawer('bulk', { preset });
    onClose();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={preset.name}
      subtitle={preset.category || 'Operation Preset'}
      size="md"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="ghost" icon={<Edit size={16} />} className="flex-1 border border-border">Edit</Button>
          <Button variant="primary" icon={<Play size={16} />} onClick={handleLoad} className="flex-[2]">Load Into Operation</Button>
        </div>
      }
    >
      <div className={styles.presetDrawer}>
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-bg-secondary border border-border">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
              <Activity size={12} /> Usage Count
            </div>
            <div className="text-xl font-bold text-primary">0 times</div>
          </div>
          <div className="p-4 rounded-2xl bg-bg-secondary border border-border">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
              <Calendar size={12} /> Last Used
            </div>
            <div className="text-sm font-bold text-primary">{formatRelativeTime(preset.created_at)}</div>
          </div>
        </div>

        {/* Configuration Summary Card */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <Zap size={14} className="text-amber-500" /> Defaults Included
          </div>
          
          <div className="p-1 rounded-2xl bg-white border border-border overflow-hidden">
            <div className="flex flex-col">
              {config.batch_id && (
                <div className="flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center"><Layers size={16} /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase">Target Batch</span>
                      <span className="text-sm font-bold">{config.batch_name || 'Selected Batch'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              )}

              {config.amount && (
                <div className="flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-success-soft text-success flex items-center justify-center"><IndianRupee size={16} /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase">Default Amount</span>
                      <span className="text-sm font-bold">₹{parseFloat(config.amount).toLocaleString()}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              )}

              {config.purpose && (
                <div className="flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-info-soft text-info flex items-center justify-center"><MessageSquare size={16} /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase">Operation Purpose</span>
                      <span className="text-sm font-bold">{config.purpose}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              )}

              {config.type && (
                <div className="flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning-soft text-warning flex items-center justify-center"><Type size={16} /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase">Entry Type</span>
                      <span className="text-sm font-bold">{config.type === 'deposit' ? 'Credit Inflow' : 'Debit Outflow'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Description Section */}
        {preset.description && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>About Shortcut</div>
            <div className="p-4 rounded-xl bg-bg-tertiary border border-border">
              <p className="text-sm text-muted leading-relaxed">
                {preset.description}
              </p>
            </div>
          </section>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="ghost" size="sm" icon={<Copy size={14} />} fullWidth>Duplicate Shortcut</Button>
        </div>
      </div>
    </Drawer>
  );
};
