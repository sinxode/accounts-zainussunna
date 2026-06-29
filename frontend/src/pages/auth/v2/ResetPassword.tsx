import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/v2/AuthLayout';
import { AuthCard, PasswordInput, AuthButton, AuthAlert } from '../../../components/auth/v2/AuthComponents';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import styles from '../../../components/auth/v2/AuthComponents.module.scss';

export const ResetPasswordV2: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    setSubmitted(true);
  };

  return (
    <AuthLayout>
      <AuthCard 
        title="Reset Password" 
        subtitle={submitted ? "Identity Secured" : "Create a new secure password for your account."}
      >
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <PasswordInput 
              label="New Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showStrength
              required
            />

            <PasswordInput 
              label="Confirm Password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={confirm && password !== confirm ? "Passwords do not match" : ""}
              required
            />

            <AuthButton type="submit" disabled={!password || password !== confirm}>
              Secure My Account
            </AuthButton>
          </form>
        ) : (
          <div className={styles.centerContent}>
            <div className={styles.successIconWrapper}><CheckCircle2 size={48} /></div>
            <AuthAlert type="success" message="Password Updated Successfully" />
            <p className={styles.description}>Your new security credentials are now active. You can proceed to the dashboard.</p>
            <Link to="/login">
              <Button variant="primary" fullWidth>Return to Login</Button>
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

