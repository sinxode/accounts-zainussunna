import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight,
  Wallet,
  GraduationCap,
  HandCoins,
  Settings,
  LogOut,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import styles from './Sidebar.module.scss';

export const Sidebar: React.FC = () => {
  const { profile, user, signOut } = useAuth();

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, path: '/' },
    { title: 'Transactions', icon: <ArrowLeftRight size={20} strokeWidth={1.75} />, path: '/transactions' },
    { title: 'Accounts', icon: <Wallet size={20} strokeWidth={1.75} />, path: '/operations' },
    { title: 'Students', icon: <GraduationCap size={20} strokeWidth={1.75} />, path: '/students' },
    { title: 'Debts', icon: <HandCoins size={20} strokeWidth={1.75} />, path: '/borrowers' },
  ];

  const generalItems = [
    { title: 'Reports', icon: <BarChart3 size={20} strokeWidth={1.75} />, path: '/reports' },
    { title: 'Settings', icon: <Settings size={20} strokeWidth={1.75} />, path: '/settings' },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';
  const roleDisplay = profile?.role ? profile.role.replace('_', ' ') : 'Manager';

  return (
    <aside className={styles.sidebar}>
      {/* Top Logo Mark */}
      <div className={styles.logoArea}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoMark}>
            <BookOpen size={18} strokeWidth={2.2} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.brandName}>Zainussunna</span>
            <span className={styles.brandCaption}>Ledger</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className={styles.navSection}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>MENU</span>
          <nav className={styles.navGroup}>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
                title={item.title}
              >
                <div className={styles.indicator} />
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.title}>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>GENERAL</span>
          <nav className={styles.navGroup}>
            {generalItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
                title={item.title}
              >
                <div className={styles.indicator} />
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.title}>{item.title}</span>
              </NavLink>
            ))}

            <button
              type="button"
              className={clsx(styles.navItem, styles.logoutBtn)}
              onClick={() => signOut()}
              title="Logout"
            >
              <div className={styles.indicator} />
              <span className={styles.icon}><LogOut size={20} strokeWidth={1.75} /></span>
              <span className={styles.title}>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* User Chip */}
      <div className={styles.userSection}>
        <Link to="/profile" className={styles.userChip}>
          <Avatar name={displayName} size="md" />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{roleDisplay}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
};
