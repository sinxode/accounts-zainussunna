import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, ShieldCheck, Mail, Plus, UserPlus, Eye, EyeOff, UserX, UserCheck } from 'lucide-react';
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
  const { role: currentUserRole, user: currentAuthUser } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = ['super_admin', 'owner'].includes(currentUserRole || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'faculty' | 'parent'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User role updated successfully');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to update user role');
    }
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      adminService.updateUserActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User status updated');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to update user status');
    }
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;

    setSubmitting(true);
    const toastId = toast.loading('Creating user account...');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
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

      // Update role via trusted RPC to ensure role assignment and audit trail
      if (data?.user?.id) {
        await adminService.updateUserRole(data.user.id, role);
      }

      toast.success('User created successfully!', { id: toastId });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('admin');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
      case 'owner':
        return <ShieldCheck size={16} className="text-primary" />;
      case 'admin':
      case 'manager':
        return <Shield size={16} className="text-success" />;
      case 'faculty':
        return <Users size={16} className="text-blue-500" />;
      default:
        return <Users size={16} className="text-dim" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-muted">Manage academy staff accounts, permissions and role assignments.</p>
        </div>
        {isSuperAdmin && (
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
                    <div className={styles.avatar}>{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
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
                    <span className="font-semibold">{u.role}</span>
                  </div>
                )
              },
              { 
                header: 'Status', 
                accessor: (u) => (
                  <Badge variant={u.is_active ? 'success' : 'danger'} size="sm">
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </Badge>
                )
              },
              { 
                header: 'Role Assignment', 
                accessor: (u) => (
                  <select 
                    className={styles.roleSelect}
                    value={u.role}
                    disabled={!isSuperAdmin || roleMutation.isPending}
                    onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="faculty">Faculty</option>
                    <option value="parent">Parent</option>
                  </select>
                )
              },
              { 
                header: 'Actions', 
                accessor: (u) => {
                  const isSelf = u.id === currentAuthUser?.id;
                  return (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant={u.is_active ? "ghost" : "soft"}
                        size="sm"
                        disabled={!isSuperAdmin || isSelf || activeMutation.isPending}
                        title={isSelf ? "Cannot deactivate yourself" : u.is_active ? "Deactivate account" : "Reactivate account"}
                        icon={u.is_active ? <UserX size={14} className="text-red-500" /> : <UserCheck size={14} className="text-emerald-600" />}
                        onClick={() => activeMutation.mutate({ id: u.id, isActive: !u.is_active })}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  );
                },
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
              placeholder="e.g. Finance Officer"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              type="email"
              placeholder="e.g. officer@zainussunna.com"
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
            <label>Approved Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className={styles.roleSelect}
            >
              <option value="admin">Admin (Financial Operations & Reversals)</option>
              <option value="super_admin">Super Admin (System & User Governance)</option>
              <option value="faculty">Faculty (Read-Only Records & Reports)</option>
              <option value="parent">Parent (Linked Children Ledger Access)</option>
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
