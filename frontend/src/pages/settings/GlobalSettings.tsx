import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Bell, Info, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { adminService } from '../../lib/adminService';
import toast from 'react-hot-toast';
import styles from './GlobalSettings.module.scss';

export const GlobalSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: adminService.getSettings
  });

  const [localSettings, setLocalSettings] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (settings) {
      const mapped = settings.reduce((acc: Record<string, string | number>, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      
      // Only update if changed to avoid cascading renders
      if (JSON.stringify(mapped) !== JSON.stringify(localSettings)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalSettings(mapped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: unknown }) => 
      adminService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings')
  });

  const handleSave = (key: string) => {
    mutation.mutate({ key, value: localSettings[key] });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="page-title">System Settings</h1>
        <p className="text-muted">Configure global thresholds and academy preferences.</p>
      </header>

      <div className={styles.grid}>
        <Card className={styles.section} padding="lg">
          <div className={styles.sectionHeader}>
            <Bell size={20} className="text-warning" />
            <h3 className={styles.sectionTitle}>Balance Thresholds</h3>
          </div>
          <p className={styles.sectionDesc}>Define when students are flagged for low or critical balances.</p>
          
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Low Balance Threshold (₹)</label>
              <div className={styles.inputAction}>
                <input 
                  type="number" 
                  value={localSettings.low_balance_threshold || ''} 
                  onChange={(e) => setLocalSettings({...localSettings, low_balance_threshold: e.target.value})}
                />
                <button onClick={() => handleSave('low_balance_threshold')}><Save size={16} /></button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Critical Balance Threshold (₹)</label>
              <div className={styles.inputAction}>
                <input 
                  type="number" 
                  value={localSettings.critical_balance_threshold || ''} 
                  onChange={(e) => setLocalSettings({...localSettings, critical_balance_threshold: e.target.value})}
                />
                <button onClick={() => handleSave('critical_balance_threshold')}><Save size={16} /></button>
              </div>
            </div>
          </div>
        </Card>

        <Card className={styles.section} padding="lg">
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} className="text-primary" />
            <h3 className={styles.sectionTitle}>Security & Governance</h3>
          </div>
          <p className={styles.sectionDesc}>Administrative rules for financial operations.</p>
          
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Reversal Period Limit (Days)</label>
              <div className={styles.inputAction}>
                <input 
                  type="number" 
                  value={localSettings.reversal_limit_days || ''} 
                  onChange={(e) => setLocalSettings({...localSettings, reversal_limit_days: e.target.value})}
                />
                <button onClick={() => handleSave('reversal_limit_days')}><Save size={16} /></button>
              </div>
              <span className={styles.hint}>Managers can only reverse transactions within this timeframe.</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.infoFooter}>
        <Info size={16} />
        <span>System settings apply globally across all academy branches and staff accounts.</span>
      </div>
    </div>
  );
};
