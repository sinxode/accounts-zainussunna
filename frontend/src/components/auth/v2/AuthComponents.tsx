import React, { useState } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import styles from './AuthComponents.module.scss';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => (
  <motion.div 
    className={styles.card}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    <header className={styles.header}>
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

  return (
    <div className={styles.inputGroup}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {props.id === 'password' && (
          <Link to="/forgot-password" className={styles.linkBtn}>
            Forgot?
          </Link>
        )}
      </div>
      <div className={clsx(styles.inputWrapper, error && styles.hasError)}>
        <div className={styles.icon}><Lock size={17} /></div>
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
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
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
    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
    <span>{message}</span>
  </motion.div>
);

export const AuthButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({ children, loading, ...props }) => (
  <button className={styles.submitBtn} disabled={loading} {...props}>
    {loading ? (
      <div className={styles.loaderArea}>
        <div className={styles.spinner} />
        <span>Verifying credentials...</span>
      </div>
    ) : (
      <>
        <span>{children}</span>
        <ArrowRight size={17} />
      </>
    )}
  </button>
);
