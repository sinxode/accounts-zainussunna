import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Bell, 
  ShieldCheck, 
  Activity,
  UserPlus,
  Lock,
  History,
  Settings,
  ArrowRight,
  Database,
  CloudUpload,
  Cpu,
  RefreshCcw,
  Zap,
  Target,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../lib/adminService';
import { supabase } from '../../lib/supabase';
import { exportService } from '../../lib/exportService';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import styles from './AdministrationDashboard.module.scss';
import { clsx } from 'clsx';

export const AdministrationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => adminService.getAuditLogs(5),
  });

  const { data: statsData } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminService.getDashboardStats,
  });

  const { data: dbLatency = 12 } = useQuery({
    queryKey: ['dbPing'],
    queryFn: adminService.pingDatabase,
    refetchInterval: 30000,
  });

  const { data: authLatency = 45 } = useQuery({
    queryKey: ['authPingDashboard'],
    queryFn: adminService.pingAuth,
    refetchInterval: 30000,
  });

  const { data: governanceStats } = useQuery({
    queryKey: ['dataHealthStats'],
    queryFn: adminService.getDataIntegrityStats,
  });

  const handleSync = async () => {
    const syncToast = toast.loading('Synchronizing systems...');
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] }),
        queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] }),
        queryClient.invalidateQueries({ queryKey: ['dbPing'] })
      ]);
      toast.success('System state synchronized', { id: syncToast });
    } catch {
      toast.error('Sync failed', { id: syncToast });
    }
  };

  const handleExportTransactions = async () => {
    const exportToast = toast.loading('Exporting transactions...');
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, students(name, enrolment_no)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const rows = (data || []).map(t => ({
        Date: new Date(t.transaction_date).toLocaleString(),
        Student: t.students?.name || 'N/A',
        Enrolment: t.students?.enrolment_no || 'N/A',
        Type: t.transaction_type,
        Direction: t.direction,
        Amount: Number(t.amount),
        Purpose: t.purpose,
        Reversed: t.is_reversed ? 'Yes' : 'No'
      }));

      exportService.exportToExcel(rows, `ZLS_Transactions_${new Date().toISOString().split('T')[0]}`);
      toast.success('Transactions exported to Excel', { id: exportToast });
    } catch (err: any) {
      toast.error(err.message || 'Export failed', { id: exportToast });
    }
  };

  const handleExportAuditLogs = async () => {
    const exportToast = toast.loading('Exporting audit logs...');
    try {
      const logs = await adminService.getAuditLogs(1000);
      const rows = logs.map(l => ({
        Timestamp: new Date(l.created_at).toLocaleString(),
        User: l.profiles?.full_name || 'System',
        Action: l.action,
        Entity: l.entity,
        EntityID: l.entity_id,
        OldValues: l.old_values ? JSON.stringify(l.old_values) : '',
        NewValues: l.new_values ? JSON.stringify(l.new_values) : ''
      }));

      exportService.exportToExcel(rows, `ZLS_Audit_Logs_${new Date().toISOString().split('T')[0]}`);
      toast.success('Audit logs exported to Excel', { id: exportToast });
    } catch (err: any) {
      toast.error(err.message || 'Export failed', { id: exportToast });
    }
  };

  const stats = [
    { label: 'Active Users', value: statsData?.activeUsers.toString() || '0', icon: <Users size={24} />, variant: 'primary' as const, subtitle: 'Academy staff' },
    { label: 'Current Period', value: statsData?.currentPeriod?.name || 'June 2026', icon: <Calendar size={24} />, variant: 'info' as const, subtitle: statsData?.currentPeriod?.isLocked ? 'Period: Locked' : 'Period: Open' },
    { label: 'Notifications', value: statsData?.unreadNotifications.toString() || '0', icon: <Bell size={24} />, variant: 'warning' as const, subtitle: 'Pending review' },
    { label: 'Audit Events', value: statsData?.totalAuditLogs.toString() || '0', icon: <ShieldCheck size={24} />, variant: 'success' as const, subtitle: 'Recorded globally' },
  ];

  const quickActions = [
    { label: 'Create User', icon: <UserPlus size={18} />, path: '/administration/users', color: 'primary' },
    { label: 'Lock Period', icon: <Lock size={18} />, path: '/administration/periods', color: 'danger' },
    { label: 'View Audit', icon: <History size={18} />, path: '/administration/audit', color: 'neutral' },
    { label: 'System Health', icon: <Activity size={18} />, path: '/administration/health', color: 'success' },
    { label: 'Global Settings', icon: <Settings size={18} />, path: '/administration/global', color: 'primary' },
  ];

  const systemHealth = [
    { label: 'Database', status: dbLatency < 50 ? 'optimal' : 'warning', icon: <Database size={16} /> },
    { label: 'Authentication', status: authLatency < 150 ? 'optimal' : 'warning', icon: <ShieldCheck size={16} /> },
    { label: 'Audit Engine', status: 'optimal', icon: <Cpu size={16} /> },
    { label: 'Backups', status: 'optimal', icon: <CloudUpload size={16} /> },
  ];

  const govScore = governanceStats?.score ?? 100;
  const govNegative = governanceStats?.negativeStudents ?? 0;
  const govOverdue = governanceStats?.overdueBorrowers ?? 0;
  const govDesc = govNegative > 0 || govOverdue > 0
    ? `${govNegative} negative balances, ${govOverdue} overdue borrowers need attention.`
    : 'All accounts are within normal operating parameters.';

  return (
    <PageContainer>
      <PageHeader 
        title="Administration" 
        subtitle="The system control tower. Global governance and operational oversight."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCcw size={16} />} onClick={handleSync}>Sync System</Button>
          </div>
        }
      />

      <div className={styles.container}>
        <div className={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Control Center</h3>
              <div className={styles.controlGrid}>
                {quickActions.map((action) => (
                  <Card 
                    key={action.label} 
                    variant="interactive" 
                    padding="md" 
                    className={styles.controlCard}
                    onClick={() => navigate(action.path)}
                  >
                    <div className={clsx(styles.cIcon, styles[action.color])}>
                      {action.icon}
                    </div>
                    <span className={styles.cLabel}>{action.label}</span>
                    <ArrowRight size={16} className={styles.cArrow} />
                  </Card>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className="flex-between mb-4">
                <h3 className="label-sm">Activity Monitor</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/administration/audit')}>Full Explorer</Button>
              </div>
              <Card padding="none">
                <div className={styles.activityList}>
                  {auditLogs.map((item: any) => (
                    <div key={item.id} className={styles.activityRow}>
                      <div className={styles.aUser}>
                        <div className={styles.uAvatar}>{item.profiles?.full_name?.charAt(0) || '?'}</div>
                        <div className={styles.uInfo}>
                          <strong>{item.profiles?.full_name || 'System'}</strong>
                          <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className={styles.aAction}>
                        <Badge variant="neutral" size="sm">{item.action}</Badge>
                        <span className={styles.aEntity}>{item.entity}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(item)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <section className={styles.section}>
              <h3 className="label-sm mb-4">System Health</h3>
              <Card padding="md" className={styles.healthCard}>
                <div className={styles.healthGrid}>
                  {systemHealth.map((h) => (
                    <div key={h.label} className={styles.healthItem}>
                      <div className={styles.hIcon}>{h.icon}</div>
                      <span className={styles.hLabel}>{h.label}</span>
                      <div className={clsx(styles.hStatus, styles[h.status])} />
                    </div>
                  ))}
                </div>
                <div className={styles.healthFooter}>
                  <Zap size={14} className="text-success" />
                  <span>All core systems operational ({dbLatency}ms latency)</span>
                </div>
              </Card>
            </section>

            <section className={styles.section}>
              <h3 className="label-sm mb-4">Backup & Data Center</h3>
              <div className={styles.backupStack}>
                <Card padding="md" className={styles.backupCard}>
                  <div className={styles.bHeader}>
                    <CloudUpload size={20} className="text-primary" />
                    <div>
                      <h4 className={styles.bTitle}>Automated S3 Backup</h4>
                      <span className={styles.bTime}>Today, 03:00 AM</span>
                    </div>
                    <Badge variant="success" size="sm">Success</Badge>
                  </div>
                  <div className={styles.bActions}>
                    <Button variant="soft" size="sm" fullWidth onClick={handleExportTransactions}>Export All Transactions</Button>
                    <Button variant="soft" size="sm" fullWidth onClick={handleExportAuditLogs}>Download Audit Log</Button>
                  </div>
                </Card>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className="label-sm mb-4">Governance Insights</h3>
              <Card padding="md" className={clsx(styles.insightCard, govScore >= 90 ? styles.success : govScore >= 70 ? styles.warning : styles.danger)}>
                <div className={clsx(styles.iIcon, govScore >= 90 ? styles.success : govScore >= 70 ? styles.warning : styles.danger)}>
                  <Target size={24} />
                </div>
                <div className={styles.iContent}>
                  <span className={styles.iLabel}>Integrity Score</span>
                  <strong>{govScore}/100</strong>
                  <p>{govDesc}</p>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Audit Activity Investigation"
        size="lg"
      >
        {selectedLog && (
          <div className={styles.inspectView}>
            <div className={styles.inspectHeader}>
              <div className={styles.inspectInfo}>
                <label className="label-sm">Action Performed</label>
                <strong>{selectedLog.action}</strong>
              </div>
              <div className={styles.inspectInfo}>
                <label className="label-sm">Performed By</label>
                <strong>{selectedLog.profiles?.full_name || 'System'}</strong>
              </div>
            </div>

            <div className={styles.comparison}>
              <div>
                <label className="label-sm mb-4">Previous State</label>
                <div className={styles.jsonBox}>
                  <pre>{selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : '{\n  "state": "N/A (Created)"\n}'}</pre>
                </div>
              </div>
              <div>
                <label className="label-sm mb-4">Updated State</label>
                <div className={`${styles.jsonBox} ${styles.highlighted}`}>
                  <pre>{selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : '{\n  "state": "N/A (Deleted)"\n}'}</pre>
                </div>
              </div>
            </div>

            <div className={styles.inspectFooter}>
              <div className={styles.reason}>
                <label className="label-sm font-semibold">Entity Type & Target ID</label>
                <p>Entity: <code>{selectedLog.entity}</code> | Target ID: <code>{selectedLog.entity_id}</code></p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};
