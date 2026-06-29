import React from 'react';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/v2/AuthLayout';
import { AuthCard } from '../../../components/auth/v2/AuthComponents';
import { Button } from '../../../components/ui/Button';
import styles from '../../../components/auth/v2/AuthComponents.module.scss';

export const AccessDeniedV2: React.FC = () => {
  return (
    <AuthLayout>
      <AuthCard 
        title="Access Denied" 
        subtitle="Operational Restriction"
      >
        <div className={styles.centerContent}>
          <div className={styles.dangerIconWrapper}>
            <ShieldAlert size={64} strokeWidth={1.5} />
          </div>
          <p className={styles.description}>
            You do not have the required security clearances to access this sector of the ZLS system. Please contact your System Owner.
          </p>
          
          <div className={styles.buttonColumn}>
            <Button size="lg" icon={<LayoutDashboard size={20} />} fullWidth onClick={() => window.location.href = '/'}>
              Return to Dashboard
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

