import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  LayoutDashboard,
  FileText, 
  Users, 
  CalendarRange, 
  Scale,
  HandCoins, 
  Clock,
  ShieldAlert,
  AlertTriangle,
  Layers
} from 'lucide-react';
import styles from './ReportTabs.module.scss';

export const ReportTabs: React.FC = () => {
  const tabs = [
    { title: 'Reports Hub', path: '/reports', exact: true, icon: <LayoutDashboard size={15} /> },
    { title: 'Student Statement', path: '/reports/student-statement', icon: <FileText size={15} /> },
    { title: 'Student Balances', path: '/reports/students', icon: <Users size={15} /> },
    { title: 'Monthly Summary', path: '/reports/monthly', icon: <CalendarRange size={15} /> },
    { title: 'Cashbook & Rec', path: '/reports/cashbook', icon: <Scale size={15} /> },
    { title: 'Borrower Loans', path: '/reports/borrowers', icon: <HandCoins size={15} /> },
    { title: 'Loan Aging', path: '/reports/borrower-aging', icon: <Clock size={15} /> },
    { title: 'Audit Trail', path: '/reports/audit', icon: <ShieldAlert size={15} /> },
    { title: 'Type Matrix', path: '/reports/transaction-types', icon: <Layers size={15} /> },
    { title: 'Exceptions', path: '/reports/reconciliation-exceptions', icon: <AlertTriangle size={15} /> },
  ];

  return (
    <div className={styles.tabsContainer} style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '4px' }}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.exact}
          className={({ isActive }) => clsx(styles.tab, isActive && styles.active)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabTitle}>{tab.title}</span>
        </NavLink>
      ))}
    </div>
  );
};
