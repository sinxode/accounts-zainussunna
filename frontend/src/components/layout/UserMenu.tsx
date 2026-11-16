import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useUIStore } from '../../store/useUIStore';
import { KeyBadge } from '../ui/KeyBadge';
import { ShortcutRegistry } from '../../lib/shortcuts/shortcutRegistry';
import styles from './UserMenu.module.scss';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { setShortcutReferenceOpen } = useUIStore();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleOpenShortcuts = () => {
    setIsOpen(false);
    setShortcutReferenceOpen(true);
  };

  const settingsShortcut = ShortcutRegistry.getShortcutById('global.settings');
  const helpShortcut = ShortcutRegistry.getShortcutById('global.shortcuts');

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button 
        className={clsx(styles.trigger, isOpen && styles.active)} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.avatar}>
          {profile?.full_name?.charAt(0) || <User size={18} />}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.name}>{profile?.full_name || 'Admin'}</span>
          <span className={styles.role}>{profile?.role || 'Staff'}</span>
        </div>
        <ChevronDown size={16} className={clsx(styles.chevron, isOpen && styles.rotate)} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.dropdown}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.header}>
              <span className={styles.label}>Signed in as</span>
              <span className={styles.email}>{profile?.full_name}</span>
            </div>
            
            <div className={styles.menu}>
              <button className={styles.item} onClick={() => handleNavigation('/profile')}>
                <div className={styles.itemLabel}>
                  <User size={16} />
                  <span>Your Profile</span>
                </div>
              </button>
              <button className={styles.item} onClick={() => handleNavigation('/settings')}>
                <div className={styles.itemLabel}>
                  <Settings size={16} />
                  <span>Settings</span>
                </div>
                {settingsShortcut && <KeyBadge shortcut={settingsShortcut} size="sm" />}
              </button>
              <button className={styles.item} onClick={handleOpenShortcuts}>
                <div className={styles.itemLabel}>
                  <Keyboard size={16} />
                  <span>Shortcuts</span>
                </div>
                {helpShortcut && <KeyBadge shortcut={helpShortcut} size="sm" />}
              </button>
              {profile?.role === 'owner' && (
                <button className={styles.item} onClick={() => handleNavigation('/settings')}>
                  <div className={styles.itemLabel}>
                    <Shield size={16} />
                    <span>Admin Panel</span>
                  </div>
                </button>
              )}
              <div className={styles.divider} />
              <button className={clsx(styles.item, styles.logout)} onClick={signOut}>
                <div className={styles.itemLabel}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
