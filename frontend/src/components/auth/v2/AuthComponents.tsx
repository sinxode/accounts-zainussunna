import React, { useState } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import styles from './AuthComponents.module.scss';
import logoImg from '../../../assets/logo_dark.png';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => (
  <motion.div 
    className={styles.card}
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <header className={styles.header}>
      <img src={logoImg} alt="ZLS Logo" className={styles.logo} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
    {children}
  </motion.div>
);

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, icon, error, ...props }) => (
  <div className={styles.inputGroup}>
    <label className={styles.label}>{label}</label>
    <div className={clsx(styles.inputWrapper, error && styles.hasError)}>
      <div className={styles.icon}>{icon}</div>
      <input className={styles.input} {...props} />
    </div>
    {error && <span className={styles.errorText}>{error}</span>}
  </div>
);

interface PasswordInputProps extends Omit<AuthInputProps, 'icon'> {
  showStrength?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ label, value, error, showStrength, ...props }) => {
  const [show, setShow] = useState(false);
  
  // Simple strength calc
  const getStrength = (val: string) => {
    if (!val) return 0;
    let s = 0;
    if (val.length > 8) s += 1;
    if (/[A-Z]/.test(val)) s += 1;
    if (/[0-9]/.test(val)) s += 1;
    if (/[^A-Za-z0-9]/.test(val)) s += 1;
    return s;
  };

  const strength = getStrength(String(value || ''));

  return (
    <div className={styles.inputGroup}>
      <div className="flex-between">
        <label className={styles.label}>{label}</label>
        {props.id === 'password' && <button type="button" className={styles.linkBtn}>Forgot?</button>}
      </div>
      <div className={clsx(styles.inputWrapper, error && styles.hasError)}>
        <div className={styles.icon}><Lock size={18} /></div>
        <input 
          className={styles.input} 
          type={show ? 'text' : 'password'} 
          {...props} 
          value={value}
        />
        <button 
          type="button" 
          className={styles.toggleBtn}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showStrength && value && (
        <div className={styles.strengthMeter}>
          <div className={styles.track}>
            <div 
              className={clsx(styles.fill, strength >= 1 && styles.weak, strength >= 3 && styles.medium, strength === 4 && styles.strong)} 
              style={{ width: `${(strength / 4) * 100}%` }}
            />
          </div>
          <span className={styles.strengthText}>
            {strength <= 1 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong'}
          </span>
        </div>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export const AuthAlert: React.FC<{ message: string; type?: 'error' | 'success' }> = ({ message, type = 'error' }) => (
  <motion.div 
    className={clsx(styles.alert, styles[type])}
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
  >
    <AlertCircle size={18} />
    <span>{message}</span>
  </motion.div>
);

export const AuthButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({ children, loading, ...props }) => (
  <button className={styles.submitBtn} disabled={loading} {...props}>
    {loading ? (
      <div className={styles.loaderArea}>
        <div className={styles.spinner} />
        <span>Signing you in...</span>
      </div>
    ) : (
      <>
        <span>{children}</span>
        <ChevronRight size={20} />
      </>
    )}
  </button>
);
