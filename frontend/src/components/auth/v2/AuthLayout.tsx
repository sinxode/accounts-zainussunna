import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import styles from './AuthLayout.module.scss';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        {/* Left: Deep-Green Institutional Hero Chamber */}
        <div className={styles.heroChamber}>
          <div className={styles.heroBrand}>
            <div className={styles.logoSquare}>
              <BookOpen size={20} strokeWidth={2.4} />
            </div>
            <div className={styles.brandTextGroup}>
              <h1 className={styles.brandName}>Zainussunna</h1>
              <span className={styles.brandPill}>Treasury Ledger</span>
            </div>
          </div>

          <div className={styles.heroMiddle}>
            <h2 className={styles.heroTitle}>Institutional Cash Ledger & Academy Accounts</h2>
            <p className={styles.heroSubtitle}>
              Authoritative treasury accounting, real-time student funds, and external credit exposure oversight.
            </p>

            <div className={styles.glassKpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiBadge}>● Verified Float</span>
                <ShieldCheck size={16} style={{ color: 'var(--lime-300)' }} />
              </div>
              <strong className={styles.kpiValue}>₹36,164.00</strong>
              <span className={styles.kpiSub}>Total Active Institutional Capital</span>
            </div>
          </div>

          <div className={styles.heroFooter}>
            <span>🔒 256-Bit Financial Encryption · Authorized Personnel</span>
          </div>
        </div>

        {/* Right: Clean White Sign-In Chamber */}
        <div className={styles.formChamber}>
          {/* Mobile-Only Brand Header */}
          <div className={styles.mobileBrandHeader}>
            <div className={styles.mobileLogoSquare}>
              <BookOpen size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className={styles.mobileBrandName}>Zainussunna</h1>
              <span className={styles.mobileBrandSub}>Ledger System</span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
