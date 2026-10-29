import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Eye,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { studentService } from '../../lib/services';
import { adminService } from '../../lib/adminService';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AllStudents.module.scss';
import { useUIStore } from '../../store/useUIStore';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { clsx } from 'clsx';

export const AllStudents: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { openDrawer } = useOperationsDrawer();
  const { setActiveModal } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canMutate = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  const { data: students, isLoading } = useQuery({
    queryKey: ['studentsSummary'],
    queryFn: studentService.getHealthSummary
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: adminService.getSettings
  });

  const thresholds = useMemo(() => {
    const s = settings.reduce((acc, curr) => ({...acc, [curr.key]: Number(curr.value)}), {} as any);
    return { low: s.low_balance_threshold || 0, critical: s.critical_balance_threshold || -1000 };
  }, [settings]);

  const getHealthVariant = (balance: number): BadgeVariant => {
    if (balance <= thresholds.critical) return 'error';
    if (balance <= thresholds.low) return 'warning';
    return 'success';
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const matchesSearch = (s.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.enrolment_no?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const balance = s.current_balance || 0;
      let matchesHealth = true;
      if (healthFilter === 'low') matchesHealth = balance <= thresholds.low && balance > thresholds.critical;
      else if (healthFilter === 'critical') matchesHealth = balance <= thresholds.critical;
      else if (healthFilter === 'healthy') matchesHealth = balance > thresholds.low;

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesHealth && matchesStatus;
    });
  }, [students, searchTerm, healthFilter, statusFilter, thresholds]);

  const stats = {
    total: students?.length || 0,
    active: students?.filter(s => s.status === 'active').length || 0,
    lowBalance: students?.filter(s => s.health_status === 'low' || s.health_status === 'critical').length || 0,
    zeroBalance: students?.filter(s => s.health_status === 'empty').length || 0,
    totalFunds: students?.reduce((acc, s) => acc + (Number(s.current_balance) || 0), 0) || 0
  };

  return (
    <PageContainer>
      <PageHeader
        title="Student Directory"
        subtitle="Authoritative student ledger directory and balance overview."
        actions={
          canMutate ? (
            <Button icon={<Plus size={18} />} onClick={() => setActiveModal('addStudent')}>
              Add Student
            </Button>
          ) : undefined
        }
      />
      <div className={styles.container}>
        <section className={styles.statsRow}>
          <StatCard label="Total Students" value={stats.total} icon={<Users size={20} />} variant="primary" />
          <StatCard label="Low Balance" value={stats.lowBalance} icon={<AlertTriangle size={20} />} variant="warning" />
          <StatCard label="Zero Balance" value={stats.zeroBalance} icon={<AlertCircle size={20} />} variant="error" />
          <StatCard label="Total Student Balances" value={`₹${stats.totalFunds.toLocaleString()}`} icon={<ArrowDownLeft size={20} />} variant="success" />
        </section>

        <Card padding="sm">
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search by name or enrollment number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterActions}>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-lg mr-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <select 
                value={healthFilter} 
                onChange={(e) => setHealthFilter(e.target.value)}
                className="p-2 border rounded-lg"
              >
                <option value="all">All Health</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low Balance</option>
                <option value="critical">Critical</option>
                <option value="empty">Empty</option>
              </select>
            </div>
          </div>
        </Card>

        <Card padding="none">
          {isLoading ? (
            <div className={`flex-center ${styles.loading}`}>
              <p>Loading authoritative student records...</p>
            </div>
          ) : (
            <DataTable 
              onRowClick={(s) => navigate(`/students/${s.id}`)}
              renderCard={(s) => (
                <div key={s.id} className={styles.studentCard} onClick={() => navigate(`/students/${s.id}`)}>
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>{s.name.charAt(0)}</div>
                    <div className={styles.details}>
                      <span className={styles.name}>{s.name}</span>
                      <span className={styles.enrollment}>{s.enrolment_no}</span>
                    </div>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={clsx(styles.balance, s.current_balance < 0 && "text-error")}>
                      ₹{s.current_balance.toLocaleString()}
                    </span>
                    <Badge variant={getHealthVariant(s.current_balance)} size="sm" pill>
                      {s.health_status}
                    </Badge>
                  </div>
                </div>
              )}
              columns={[
                { 
                  header: 'Student', 
                  accessor: (s) => (
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>{s.name.charAt(0)}</div>
                      <div className={styles.details}>
                        <span className={styles.name}>{s.name}</span>
                        <span className={styles.enrollment}>{s.enrolment_no}</span>
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Current Balance', 
                  align: 'right',
                  accessor: (s) => (
                    <div className="flex flex-col items-end">
                      <span className={clsx(styles.balance, s.current_balance < 0 && "text-error font-semibold")}>
                        ₹{Number(s.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <div className="mobile-only-flex items-center gap-1 mt-1">
                        <Badge variant={getHealthVariant(s.current_balance)} size="sm" pill>
                          {s.health_status}
                        </Badge>
                        <span className="text-muted text-xs">
                          {s.last_transaction_date 
                            ? new Date(s.last_transaction_date).toLocaleDateString() 
                            : 'No activity'}
                        </span>
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Health Status', 
                  responsiveHidden: 'mobile',
                  align: 'center',
                  accessor: (s) => (
                    <Badge variant={getHealthVariant(s.current_balance)} size="sm" pill>
                      {s.health_status}
                    </Badge>
                  )
                },
                { 
                  header: 'Last Activity', 
                  responsiveHidden: 'mobile',
                  align: 'center',
                  accessor: (s) => s.last_transaction_date 
                    ? new Date(s.last_transaction_date).toLocaleDateString() 
                    : 'No activity' 
                },
                { 
                  header: 'Actions', 
                  align: 'right',
                  accessor: (s) => (
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                      {canMutate && (
                        <>
                          <button onClick={() => openDrawer('deposit', { studentId: s.id })} title="Deposit"><ArrowDownLeft size={16} /></button>
                          <button onClick={() => openDrawer('withdrawal', { studentId: s.id })} title="Withdraw"><ArrowUpRight size={16} /></button>
                        </>
                      )}
                      <button onClick={() => navigate(`/students/${s.id}`)} title="View Profile"><Eye size={16} /></button>
                    </div>
                  )
                }
              ]}
              data={filteredStudents}
            />
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
