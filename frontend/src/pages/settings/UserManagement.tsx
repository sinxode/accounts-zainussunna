import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, ShieldCheck, Mail, Clock, Plus, UserPlus, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminService } from '../../lib/adminService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './UserManagement.module.scss';

export const UserManagement: React.FC = () => {
  const { role: currentUserRole } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = currentUserRole === 'owner';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: 'owner' | 'manager' | 'staff' }) => 
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User role updated');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to update user');
    }
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;

    setSubmitting(true);
    const toastId = toast.loading('Creating user account...');

    try {
      // Create a separate, non-persistent client to prevent overwriting the current owner's session
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      // Sign up the user
      const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) throw error;

      // In case the trigger doesn't automatically insert or we need to update the role manually,
      // we check if a profile is created. If it is, update role to ensure exact role matches.
      if (data?.user?.id) {
        await adminService.updateUserRole(data.user.id, role);
      }

      toast.success('User created successfully!', { id: toastId });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <ShieldCheck size={16} className="text-primary" />;
      case 'manager': return <Shield size={16} className="text-success" />;
      default: return <Users size={16} className="text-dim" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-muted">Manage academy staff and control access levels.</p>
        </div>
        {isOwner && (
          <Button 
            variant="primary" 
            icon={<Plus size={18} />} 
            onClick={() => setIsModalOpen(true)}
          >
            Add User
          </Button>
        )}
      </header>

      <Card>
        {isLoading ? (
          <div className={`flex-center ${styles.loading}`}>Loading users...</div>
        ) : (
          <DataTable 
            columns={[
              { 
                header: 'Full Name', 
                accessor: (u) => (
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{u.full_name.charAt(0).toUpperCase()}</div>
                    <div className={styles.details}>
                      <span className={styles.name}>{u.full_name}</span>
                      <div className={styles.meta}><Mail size={12} /> <span>{u.id.substring(0, 8)}...</span></div>
                    </div>
                  </div>
                )
              },
              { 
                header: 'Role', 
                accessor: (u) => (
                  <div className={styles.roleBadge}>
                    {getRoleIcon(u.role)}
                    <span>{u.role}</span>
                  </div>
                )
              },
              { 
                header: 'Status', 
                accessor: (u) => (
                  <Badge variant={u.is_active ? 'success' : 'neutral'} size="sm">
                    {u.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                )
              },
              { 
                header: 'Last Login', 
                accessor: (u) => u.last_login ? (
                  <div className={styles.meta}><Clock size={12} /> <span>{new Date(u.last_login).toLocaleDateString()}</span></div>
                ) : 'Never'
              },
              { 
                header: 'Actions', 
                accessor: (u) => (
                  <select 
                    className={styles.roleSelect}
                    value={u.role}
                    disabled={!isOwner || mutation.isPending}
                    onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value as 'owner' | 'manager' | 'staff' })}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                ),
                align: 'right'
              }
            ]}
            data={users || []}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User Account"
        size="md"
      >
        <form onSubmit={handleCreateUser} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input 
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              type="email"
              placeholder="e.g. john@zainussunna.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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

          <div className={styles.inputGroup}>
            <label>System Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as 'owner' | 'manager' | 'staff')}
              className={styles.roleSelect}
            >
              <option value="staff">Staff (Standard operations)</option>
              <option value="manager">Manager (High level reversals)</option>
              <option value="owner">Owner (Full system control)</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={<UserPlus size={18} />}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
