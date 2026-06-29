import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  LineChart, 
  CalendarRange, 
  Users, 
  HandCoins, 
  TrendingUp 
} from 'lucide-react';
import styles from './ReportTabs.module.scss';

export const ReportTabs: React.FC = () => {
  const tabs = [
    { title: 'Financial Summary', path: '/reports', exact: true, icon: <LineChart size={16} /> },
    { title: 'Monthly Reports', path: '/reports/monthly', icon: <CalendarRange size={16} /> },
    { title: 'Student Reports', path: '/reports/students', icon: <Users size={16} /> },
    { title: 'Borrower Reports', path: '/reports/borrowers', icon: <HandCoins size={16} /> },
    { title: 'Analytics', path: '/reports/analytics', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className={styles.tabsContainer}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.exact}
          className={({ isActive }) => clsx(styles.tab, isActive && styles.active)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabTitle}>{tab.title}</span>
        </NavLink>
      ))}
    </div>
  );
};
