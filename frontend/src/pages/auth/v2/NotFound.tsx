import React from 'react';
import { Compass, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/v2/AuthLayout';
import { AuthCard } from '../../../components/auth/v2/AuthComponents';
import { Button } from '../../../components/ui/Button';
import styles from '../../../components/auth/v2/AuthComponents.module.scss';

export const NotFoundV2: React.FC = () => {
  return (
    <AuthLayout>
      <AuthCard 
        title="404 — Not Found" 
        subtitle="Operational Path Lost"
      >
        <div className={styles.centerContent}>
          <div className={styles.infoIconWrapper}>
            <Compass size={64} strokeWidth={1.5} />
          </div>
          <p className={styles.description}>
            The operational module or record you are attempting to reach does not exist or has been relocated.
          </p>
          
          <div className={styles.buttonColumn}>
            <Button size="lg" icon={<LayoutDashboard size={20} />} fullWidth onClick={() => window.location.href = '/'}>
              Return to Control Center
            </Button>
            <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

