import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Mail, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './UserProfile.module.scss';

export const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setUpdating(true);
    const updateToast = toast.loading('Updating profile...');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Profile updated successfully!', { id: updateToast });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile', { id: updateToast });
    } finally {
      setUpdating(false);
    }
  };

  const initial = fullName.charAt(0).toUpperCase() || '?';

  return (
    <PageContainer>
      <PageHeader title="User Profile" subtitle="Manage your account details and security settings." />
      <div className={styles.profileWrapper}>
        <Card padding="lg" className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.bigAvatar}>{initial}</div>
            <div className={styles.avatarMeta}>
              <h3>{profile?.full_name || 'Staff Member'}</h3>
              <span className={styles.roleTag}>
                <Shield size={14} />
                {profile?.role || 'staff'}
              </span>
            </div>
          </div>

          <form className={styles.profileForm} onSubmit={handleUpdateProfile}>
            <div className={styles.inputGroup}>
              <label>
                <User size={16} />
                <span>Full Name</span>
              </label>
              <input 
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>
                <Mail size={16} />
                <span>Email Address</span>
              </label>
              <input 
                type="email"
                value={user?.email || ''}
                disabled
                className={styles.disabledInput}
              />
              <span className={styles.hint}>Email addresses cannot be changed directly. Contact support if needed.</span>
            </div>

            <div className={styles.inputGroup}>
              <label>
                <Shield size={16} />
                <span>Role / Access Level</span>
              </label>
              <input 
                type="text"
                value={profile?.role ? profile.role.toUpperCase() : 'STAFF'}
                disabled
                className={styles.disabledInput}
              />
              <span className={styles.hint}>Your role is managed by the system administrator.</span>
            </div>

            <div className={styles.actions}>
              <Button 
                type="submit" 
                variant="primary" 
                icon={<Save size={18} />} 
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
