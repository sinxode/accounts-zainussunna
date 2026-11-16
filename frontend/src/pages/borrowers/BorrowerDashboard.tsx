import React, { useState, useMemo } from 'react';
import { 
  HandCoins, 
  Users, 
  BadgeIndianRupee, 
  AlertTriangle,
  Search,
  Plus,
  History,
  ArrowRight,
  Receipt,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PillTabs } from '../../components/ui/PillTabs';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import styles from './BorrowerDashboard.module.scss';
import { useBorrowerStatus } from '../../hooks/useBorrowerStatus';
import { borrowerService } from '../../lib/services';
import { useQuery } from '@tanstack/react-query';

// Helper to determine risk and status badges based on dynamic rules
const BorrowerRiskAndStatusBadge: React.FC<{ borrower: any }> = ({ borrower }) => {
  const { isOverdue, status } = useBorrowerStatus(borrower);
  
  const baseRisk = borrower.risk_level || 'low';
  const dynamicRisk = isOverdue ? 'high' : baseRisk;
  
  const riskLabel = dynamicRisk === 'high' ? 'High Risk' : dynamicRisk === 'medium' ? 'Medium Risk' : 'Low Risk';
  const riskVariant = dynamicRisk === 'high' ? 'danger' : dynamicRisk === 'medium' ? 'warning' : 'success';
  const statusVariant = isOverdue ? 'danger' : 'success';

  return (
    <div className={styles.badgeGroup}>
      <Badge variant={statusVariant} size="sm" pill>
        {status}
      </Badge>
      <Badge variant={riskVariant} size="sm" pill>
        {riskLabel}
      </Badge>
    </div>
  );
};

export const BorrowerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'overdue'>('all');

  const { data: borrowers = [], isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowerService.list
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['borrowerDashboardStats'],
    queryFn: borrowerService.getDashboardStats
  });

  const totalOutstanding = dashboardStats?.outstanding ?? borrowers.reduce((acc: number, b: any) => acc + (Number(b.total_outstanding) || 0), 0);
  const totalRecovered = dashboardStats?.totalRecoveries ?? borrowers.reduce((acc: number, b: any) => acc + (b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0), 0);
  const activeCount = borrowers.filter(b => b.status === 'active').length;
  const overdueCount = borrowers.filter(b => b.status === 'overdue').length;

  const stats = [
    { label: 'Outstanding Balance', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, icon: <HandCoins size={22} />, variant: 'danger' as const, subtitle: 'Total exposure' },
    { label: 'Active Borrowers', value: activeCount.toString(), icon: <Users size={22} />, variant: 'primary' as const, subtitle: 'Current registered debtors' },
    { label: 'Total Recoveries', value: `₹${totalRecovered.toLocaleString('en-IN')}`, icon: <BadgeIndianRupee size={22} />, variant: 'success' as const, subtitle: 'Confirmed repayments' },
    { label: 'Overdue Borrowers', value: overdueCount.toString(), icon: <AlertTriangle size={22} />, variant: 'warning' as const, subtitle: 'Attention needed' },
  ];

  const filteredBorrowers = useMemo(() => {
    return borrowers.filter(b => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        b.name?.toLowerCase().includes(term) ||
        b.phone?.toLowerCase().includes(term);

      const matchesTab = filterTab === 'all' || b.status === filterTab;
      return matchesSearch && matchesTab;
    });
  }, [borrowers, searchTerm, filterTab]);

  return (
    <PageContainer>
      <div className={styles.grid}>
        {/* KPI Strip */}
        <div className={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Action & Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterSection}>
            <PillTabs
              value={filterTab}
              onChange={(val) => setFilterTab(val as any)}
              variant="lime"
              options={[
                { value: 'all', label: 'All Debtors', count: borrowers.length },
                { value: 'active', label: 'Active', count: activeCount },
                { value: 'overdue', label: 'Overdue', count: overdueCount },
              ]}
            />
            <div className={styles.searchBox}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search debtors..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button 
              variant="primary" 
              size="sm"
              icon={<Plus size={16} />} 
              onClick={() => openDrawer('external')}
            >
              New Loan
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              icon={<History size={16} />} 
              onClick={() => openDrawer('recovery')}
            >
              Record Recovery
            </Button>
          </div>
        </div>

        {/* Minimal Responsive Cards */}
        {isLoading ? (
          <div className={styles.emptyState}>
            Loading borrower portfolio...
          </div>
        ) : filteredBorrowers.length === 0 ? (
          <div className={styles.emptyState}>
            No debtors found matching your criteria.
          </div>
        ) : (
          <div className={styles.debtorList}>
            {filteredBorrowers.map((b: any) => {
              const totalLoaned = b.borrower_loans?.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) || 0;
              const recs = b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0;
              const outstanding = totalLoaned - recs;
              const loanCount = b.borrower_loans?.length || 0;

              return (
                <div 
                  key={b.id} 
                  className={styles.debtorCard}
                  onClick={() => navigate(`/borrowers/${b.id}`)}
                >
                  <div className={styles.debtorPrimary}>
                    <div className={styles.avatar}>
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.debtorDetails}>
                      <span className={styles.debtorName}>{b.name}</span>
                      <div className={styles.debtorMeta}>
                        {b.phone && (
                          <span className={styles.metaItem}>
                            <Phone size={12} /> {b.phone}
                          </span>
                        )}
                        <span className={styles.metaItem}>
                          {loanCount} {loanCount === 1 ? 'loan' : 'loans'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.debtorStatus}>
                    <BorrowerRiskAndStatusBadge borrower={b} />
                  </div>

                  <div className={styles.debtorAmount}>
                    <span className={styles.amountLabel}>Outstanding</span>
                    <span className={styles.amountValue}>
                      ₹{outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="soft" 
                      size="sm" 
                      icon={<Receipt size={14} />}
                      onClick={() => openDrawer('recovery')}
                    >
                      Recover
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/borrowers/${b.id}`)}
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
