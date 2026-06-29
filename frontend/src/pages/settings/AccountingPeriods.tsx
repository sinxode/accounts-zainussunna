import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock, Shield, Calendar, UserCheck, PlusCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../lib/adminService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './AccountingPeriods.module.scss';

export const AccountingPeriods: React.FC = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = role === 'owner';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: periods, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: adminService.getPeriods
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, lock }: { id: string, lock: boolean }) => 
      adminService.togglePeriodLock(id, lock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      toast.success('Period status updated');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to update period');
    }
  });

  const createMutation = useMutation({
    mutationFn: () => adminService.createPeriod(currentYear, currentMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      toast.success(`Period created: ${monthNames[currentMonth - 1]} ${currentYear}`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to create period');
    }
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Check if current month period already exists
  const currentPeriodExists = (periods || []).some(
    (p) => p.period_year === currentYear && p.period_month === currentMonth
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">Accounting Periods</h1>
          <p className="text-muted">Control financial locks to prevent changes to historical data.</p>
        </div>
        <div className="flex gap-2 items-center">
          {isOwner && (
            <Badge variant="primary" icon={<Shield size={14} />}>Owner Control Active</Badge>
          )}
          {isOwner && !currentPeriodExists && !isLoading && (
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={16} />}
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              Create {monthNames[currentMonth - 1]} {currentYear}
            </Button>
          )}
        </div>
      </header>

      <Card className={styles.tableCard}>
        <div className={styles.infoBox}>
          <Lock size={18} />
          <p>Locked periods prevent all staff and managers from creating or reversing transactions. Only Owners can override these locks.</p>
        </div>

        {isLoading ? (
          <div className={`flex-center ${styles.loading}`}>Loading periods...</div>
        ) : (periods || []).length === 0 ? (
          <div className="flex-center p-8 text-muted flex-col gap-3">
            <Calendar size={32} className="text-dim" />
            <span>No accounting periods found.</span>
            {isOwner && (
              <Button
                variant="primary"
                icon={<PlusCircle size={16} />}
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                Create {monthNames[currentMonth - 1]} {currentYear}
              </Button>
            )}
          </div>
        ) : (
          <DataTable 
            columns={[
              { 
                header: 'Period', 
                accessor: (p) => (
                  <div className={styles.periodInfo}>
                    <Calendar size={18} className="text-dim" />
                    <span>{monthNames[p.period_month - 1]} {p.period_year}</span>
                  </div>
                )
              },
              { 
                header: 'Status', 
                accessor: (p) => (
                  <Badge variant={p.is_locked ? 'danger' : 'success'} pill>
                    {p.is_locked ? 'Locked' : 'Open'}
                  </Badge>
                )
              },
              { 
                header: 'Locked By', 
                accessor: (p) => p.is_locked ? (
                  <div className={styles.metaInfo}>
                    <UserCheck size={14} />
                    <span>{p.profiles?.full_name}</span>
                  </div>
                ) : '-'
              },
              { 
                header: 'Locked Date', 
                accessor: (p) => p.locked_at ? new Date(p.locked_at).toLocaleDateString() : '-'
              },
              { 
                header: 'Actions', 
                accessor: (p) => (
                  <button 
                    className={p.is_locked ? styles.unlockBtn : styles.lockBtn}
                    disabled={!isOwner || toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ id: p.id, lock: !p.is_locked })}
                  >
                    {p.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
                    <span>{p.is_locked ? 'Unlock' : 'Lock Period'}</span>
                  </button>
                ),
                align: 'right'
              }
            ]}
            data={periods || []}
          />
        )}
      </Card>
    </div>
  );
};
