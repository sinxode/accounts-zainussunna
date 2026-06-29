import React from 'react';
import { 
  Users, 
  History, 
  Calendar, 
  HandCoins, 
  BarChart3, 
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './AuthLayout.module.scss';
import { clsx } from 'clsx';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const featureCards = [
  { icon: <Users size={20} />, title: 'Students Management', desc: 'Holistic student ledger control.' },
  { icon: <History size={20} />, title: 'Transactions Engine', desc: 'Atomic financial source of truth.' },
  { icon: <Calendar size={20} />, title: 'Events Workspace', desc: 'Streamlined bulk operational units.' },
  { icon: <HandCoins size={20} />, title: 'Borrowers Tracking', desc: 'External debt & exposure management.' },
  { icon: <BarChart3 size={20} />, title: 'Reports & Insights', desc: 'Real-time financial intelligence.' },
  { icon: <ShieldCheck size={20} />, title: 'Administration', desc: 'Secure governance & audit control.' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      {/* Left Branding Panel (40%) */}
      <aside className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          <div className={styles.brandHeader}>
            <div className={styles.logo}>Z</div>
            <div className={styles.brandText}>
              <h1 className={styles.brandTitle}>ZLS</h1>
              <span className={styles.brandTagline}>Financial Operations Platform</span>
            </div>
          </div>
          
          <div className={styles.featureGrid}>
            {featureCards.map((card, i) => (
              <motion.div 
                key={card.title}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.fIcon}>{card.icon}</div>
                <div className={styles.fText}>
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={styles.brandingFooter}>
            <p>Academy Treasury Management System — v1.0.4</p>
          </div>
        </div>
      </aside>

      {/* Right Auth Panel (60%) */}
      <main className={styles.authPanel}>
        <div className={styles.authContainer}>
          {children}
          
          <footer className={styles.authFooter}>
            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                <div className={clsx(styles.dot, styles.success)} />
                <span>Database Connected</span>
              </div>
              <div className={styles.statusItem}>
                <div className={clsx(styles.dot, styles.success)} />
                <span>Auth Active</span>
              </div>
            </div>
            <p className={styles.copy}>© 2026 Zainussunna Ledger System. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </div>
  );
};
