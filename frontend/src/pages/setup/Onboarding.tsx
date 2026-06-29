import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  School,
  Rocket,
  ChevronRight,
  Database
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import styles from './Onboarding.module.scss';
import { clsx } from 'clsx';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [academyData, setAcademyData] = useState({
    name: '',
    branch: '',
    ownerName: '',
    currency: 'INR (₹)'
  });

  const steps = [
    { id: 1, title: 'Academy Profile', icon: <School size={20} /> },
    { id: 2, title: 'Ownership', icon: <ShieldCheck size={20} /> },
    { id: 3, title: 'Configurations', icon: <Settings size={20} /> },
    { id: 4, title: 'Launch', icon: <Rocket size={20} /> },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>ZLS</div>
        <div className={styles.steps}>
          {steps.map((s) => (
            <div key={s.id} className={clsx(styles.stepItem, step === s.id && styles.active, step > s.id && styles.completed)}>
              <div className={styles.stepIcon}>{step > s.id ? <CheckCircle2 size={18} /> : s.icon}</div>
              <span className={styles.stepTitle}>{s.title}</span>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <ShieldCheck size={16} />
          <span>Secure Enterprise Setup</span>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.pane}>
              <h2 className={styles.title}>Welcome to ZLS</h2>
              <p className={styles.subtitle}>Let's start by setting up your academy's primary profile information.</p>
              
              <div className={styles.form}>
                <Input 
                  label="Academy Name" 
                  placeholder="e.g. Zainussunna Academy"
                  value={academyData.name}
                  onChange={(e) => setAcademyData({...academyData, name: e.target.value})}
                />
                <Input 
                  label="Primary Branch" 
                  placeholder="e.g. Main Campus, Kerala"
                  value={academyData.branch}
                  onChange={(e) => setAcademyData({...academyData, branch: e.target.value})}
                />
                <div className={styles.infoBox}>
                  <Database size={18} />
                  <p>This information will be used to brand your global treasury reports and financial statements.</p>
                </div>
              </div>

              <div className={styles.actions}>
                <Button 
                  size="lg" 
                  fullWidth 
                  disabled={!academyData.name} 
                  onClick={() => setStep(2)}
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                >
                  Continue to Ownership
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={clsx(styles.pane, styles.centered)}>
              <div className={styles.successIcon}>
                <Rocket size={48} />
              </div>
              <h2 className={styles.title}>System Ready for Launch</h2>
              <p className={styles.subtitle}>Your academy treasury management system is now fully configured and secured.</p>
              
              <Card padding="lg" className={styles.readyCard}>
                <div className={styles.readyGrid}>
                  <div className={styles.rItem}>
                    <span>Academy</span>
                    <strong>{academyData.name}</strong>
                  </div>
                  <div className={styles.rItem}>
                    <span>Branch</span>
                    <strong>{academyData.branch}</strong>
                  </div>
                  <div className={styles.rItem}>
                    <span>Environment</span>
                    <Badge variant="success">Production</Badge>
                  </div>
                </div>
              </Card>

              <div className={styles.actions}>
                <Button size="lg" fullWidth>Open Dashboard</Button>
                <Button size="lg" fullWidth variant="soft" className="mt-4">Import Initial Students</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
