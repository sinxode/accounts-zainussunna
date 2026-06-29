import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/v2/AuthLayout';
import { AuthCard, AuthInput, AuthButton, AuthAlert } from '../../../components/auth/v2/AuthComponents';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import styles from '../../../components/auth/v2/AuthComponents.module.scss';

export const ForgotPasswordV2: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout>
      <AuthCard 
        title="Forgot Password" 
        subtitle={submitted ? "Check your inbox" : "Enter your email to receive reset instructions."}
      >
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <AuthInput 
              label="Email Address"
              type="email"
              placeholder="admin@zainussunna.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthButton type="submit">
              Send Reset Link
            </AuthButton>

            <div className={styles.footerLinkWrapper}>
              <Link to="/login" className={styles.backToLoginLink}>
                <ArrowLeft size={16} />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        ) : (
          <div className={styles.centerContent}>
            <AuthAlert type="success" message={`A password reset link has been sent to ${email}.`} />
            <p className={styles.description}>Please follow the link in your email to securely reset your credentials.</p>
            <Link to="/login">
              <Button variant="ghost" fullWidth>Return to Login</Button>
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

