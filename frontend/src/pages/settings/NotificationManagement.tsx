import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../lib/adminService';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';
import styles from './NotificationManagement.module.scss';
import { clsx } from 'clsx';

export const NotificationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: adminService.getNotifications
  });

  const mutation = useMutation({
    mutationFn: (id: string) => adminService.resolveNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      toast.success('Alert marked as resolved');
    },
    onError: () => {
      toast.error('Failed to resolve alert');
    }
  });

  const resolveAllMutation = useMutation({
    mutationFn: async () => {
      const pending = rawNotifications.filter((n: any) => !n.is_read);
      await Promise.all(pending.map((n: any) => adminService.resolveNotification(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      toast.success('All alerts resolved');
    },
    onError: () => toast.error('Failed to resolve all alerts')
  });

  const notifications = rawNotifications.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    status: n.is_read ? 'resolved' : 'pending',
    date: new Date(n.created_at).toLocaleDateString(),
    severity: n.type === 'alert' || n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'success' : 'info'
  }));

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === 'all' 
      ? true 
      : activeTab === 'pending' 
        ? n.status === 'pending' 
        : n.status === 'resolved';
    
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'danger': return <Badge variant="danger" size="sm">Critical</Badge>;
      case 'warning': return <Badge variant="warning" size="sm">Warning</Badge>;
      case 'info': return <Badge variant="info" size="sm">Info</Badge>;
      default: return <Badge variant="neutral" size="sm">Normal</Badge>;
    }
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const resolvedCount = notifications.filter(n => n.status === 'resolved').length;

  return (
    <PageContainer>
      <PageHeader 
        title="Notification Center" 
        subtitle="Manage global system alerts and operational notifications."
        actions={
          pendingCount > 0 ? (
            <Button 
              variant="soft" 
              size="sm"
              onClick={() => resolveAllMutation.mutate()}
              disabled={resolveAllMutation.isPending}
            >
              Resolve All ({pendingCount})
            </Button>
          ) : undefined
        }
      />

      <div className={styles.container}>
        <Card padding="md" className={styles.summaryCard}>
          <div className={styles.summaryGrid}>
            <div className={styles.sumItem}>
              <span className="label-sm">Active Alerts</span>
              <strong>{pendingCount}</strong>
            </div>
            <div className={styles.sumDivider} />
            <div className={styles.sumItem}>
              <span className="label-sm">Resolved (All Time)</span>
              <strong>{resolvedCount}</strong>
            </div>
            <div className={styles.sumDivider} />
            <div className={styles.sumItem}>
              <span className="label-sm">Relay Status</span>
              <div className={styles.healthStatus}>
                <div className={styles.dot} />
                <span>Optimal</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.tabsRow}>
          <div className={styles.tabs}>
            <button className={clsx(styles.tab, activeTab === 'all' && styles.active)} onClick={() => setActiveTab('all')}>All Alerts ({notifications.length})</button>
            <button className={clsx(styles.tab, activeTab === 'pending' && styles.active)} onClick={() => setActiveTab('pending')}>Pending ({pendingCount})</button>
            <button className={clsx(styles.tab, activeTab === 'resolved' && styles.active)} onClick={() => setActiveTab('resolved')}>Resolved ({resolvedCount})</button>
          </div>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filter alerts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card padding="none" className={styles.tableCard}>
          {isLoading ? (
            <div className="flex-center p-8 text-muted">Loading alerts...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex-center p-8 text-muted">No alerts found.</div>
          ) : (
            <DataTable 
              columns={[
                { 
                  header: 'Alert Details', 
                  accessor: (n) => (
                    <div className={styles.titleCell}>
                      <div className={clsx(styles.iconArea, styles[n.severity])}>
                        {n.severity === 'danger' ? <ShieldAlert size={16} /> : <Bell size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={styles.titleText}>{n.title}</span>
                        <span className="text-xs text-muted mt-1">{n.message}</span>
                      </div>
                    </div>
                  )
                },
                { header: 'Date', accessor: 'date' },
                { header: 'Severity', accessor: (n) => getSeverityBadge(n.severity) },
                { 
                  header: 'Status', 
                  accessor: (n) => (
                    <Badge variant={n.status === 'resolved' ? 'success' : 'warning'} size="sm" pill>
                      {n.status}
                    </Badge>
                  )
                },
                { 
                  header: '', 
                  accessor: (n) => n.status === 'pending' ? (
                    <Button 
                      variant="soft" 
                      size="sm" 
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate(n.id)}
                    >
                      Resolve
                    </Button>
                  ) : null,
                  align: 'right'
                }
              ]}
              data={filteredNotifications}
            />
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
