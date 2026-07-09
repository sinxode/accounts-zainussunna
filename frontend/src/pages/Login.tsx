import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import styles from './Login.module.scss';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo_dark.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save rememberMe configuration so custom storage driver knows how to persist the Supabase session
    localStorage.setItem('zls-remember-me', rememberMe ? 'true' : 'false');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast.success('Successfully logged in!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob} />
      <Card className={styles.card} padding="xl">
        <div className={styles.header}>
          <img src={logoImg} alt="ZLS Logo" className={styles.logo} />
          <h1 className={styles.title}>Welcome to ZLS</h1>
          <p className={styles.subtitle}>Log in to your academy control center</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.icon} />
              <input 
                type="email" 
                placeholder="admin@zainussunna.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className="flex-between">
              <label>Password</label>
              <button type="button" className={styles.forgotBtn}>Forgot?</button>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.icon} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.rememberMe}>
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Remember this device</label>
          </div>

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <AlertCircle size={14} />
          <span>Internal Use Only — ZLS Production v1.0</span>
        </div>
      </Card>
    </div>
  );
};
