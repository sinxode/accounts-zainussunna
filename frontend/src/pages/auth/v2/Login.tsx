import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Checkbox } from '../../../components/ui/Checkbox';
import { AuthLayout } from '../../../components/auth/v2/AuthLayout';
import { AuthCard, AuthInput, PasswordInput, AuthButton, AuthAlert } from '../../../components/auth/v2/AuthComponents';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

export const LoginV2: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
      
      toast.success('Access granted. Welcome back.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard 
        title="Welcome Back" 
        subtitle="Sign in to your ZLS control tower to continue."
      >
        <form onSubmit={handleLogin}>
          {error && <AuthAlert message={error} />}
          
          <AuthInput 
            label="Email Address"
            type="email"
            placeholder="admin@zainussunna.com"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput 
            label="Password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Checkbox label="Remember this device" id="remember" />

          <AuthButton type="submit" loading={loading}>
            Sign In
          </AuthButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
