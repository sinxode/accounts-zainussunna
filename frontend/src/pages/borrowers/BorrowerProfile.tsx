import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  HandCoins, 
  TrendingUp,
  AlertTriangle,
  Phone,
  Scale,
  BadgeIndianRupee,
  Zap,
  Target,
  Trash2,
  MessageCircle,
  Printer
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { borrowerService } from '../../lib/services';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { useUIStore } from '../../store/useUIStore';
import toast from 'react-hot-toast';
import styles from './BorrowerProfile.module.scss';
import { clsx } from 'clsx';
import { useBorrowerStatus } from '../../hooks/useBorrowerStatus';

export const BorrowerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { openDrawer } = useOperationsDrawer();
  const { setExportData, setActiveModal, openConfirmation } = useUIStore();

  const { data: borrower, isLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => borrowerService.getById(id!),
    enabled: !!id
  });

  const { isOverdue, status, lastRecoveryDays, limitDays, isCountdownFromRecovery, hasLoans } = useBorrowerStatus(borrower);

  const deleteLoanMutation = useMutation({
    mutationFn: (loanId: string) => borrowerService.deleteLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['transferSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
      toast.success('Loan record deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  if (isLoading || !borrower) return <PageContainer>Loading...</PageContainer>;

  const baseRisk = borrower.risk_level || 'low';
  const dynamicRisk = isOverdue ? 'high' : baseRisk;
  const riskClass = dynamicRisk === 'high' ? styles.danger : dynamicRisk === 'medium' ? styles.warning : styles.success;
  
  const riskLabel = dynamicRisk === 'high' ? 'High Risk' : dynamicRisk === 'medium' ? 'Medium Risk' : 'Low Risk';
  const riskScoreLabel = dynamicRisk === 'high' ? 'High Exposure' : dynamicRisk === 'medium' ? 'Medium Exposure' : 'Low Exposure';
  const riskScoreSub = dynamicRisk === 'high' ? 'Payment overdue or high risk' : dynamicRisk === 'medium' ? 'Medium risk borrower' : 'Stable and compliant';
  const riskBadgeVariant = dynamicRisk === 'high' ? 'danger' : dynamicRisk === 'medium' ? 'warning' : 'success';

  const loans = borrower.borrower_loans || [];
  const totalLoaned = loans.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0);
  const totalRecovered = loans.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0);
  const outstanding = totalLoaned - totalRecovered;

  const timeline = loans.flatMap((l: any) => [
    { id: `loan-${l.id}`, title: 'Loan Issued', amount: `₹${Number(l.loan_amount).toLocaleString()}`, time: new Date(l.loan_date).toLocaleDateString(), icon: <HandCoins size={16} />, color: 'danger' },
    ...(l.recoveries?.map((r: any) => ({
      id: `rec-${r.id}`, title: 'Recovery Recorded', amount: `₹${Number(r.amount).toLocaleString()}`, time: new Date(r.recovery_date).toLocaleDateString(), icon: <BadgeIndianRupee size={16} />, color: 'success'
    })) || [])
  ]).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const handleContact = () => {
    if (borrower.phone) {
      window.location.href = `tel:${borrower.phone}`;
    } else {
      toast.error('No phone number provided');
    }
  };

  const handleSendWhatsApp = () => {
    const loanBreakdown = loans
      .filter((l: any) => l.status === 'active')
      .map((l: any) => `  • ${l.purpose}: ₹${Number(l.loan_amount).toLocaleString('en-IN')}`)
      .join('\n');

    const message = `*ZAINUSSUNNA LEDGER SYSTEM*
*LOAN STATEMENT & INVOICE*
━━━━━━━━━━━━━━━━━━━━━━━
*Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
*Borrower:* ${borrower.name}
${borrower.phone ? `*Phone:* ${borrower.phone}` : ''}

*Portfolio Summary:*
┌───────────────────────
${loanBreakdown ? `${loanBreakdown}` : '  • No active loans found'}
└───────────────────────

*Financial Standing:*
• Outstanding Balance: *₹${outstanding.toLocaleString('en-IN')}*
• Account Status: *${isOverdue ? '⚠️ OVERDUE / ACTION REQUIRED' : '✅ COMPLIANT'}*

━━━━━━━━━━━━━━━━━━━━━━━
Please arrange to deposit the recovery amount or process your repayment online at:
🌐 https://zls.zainussunna.org/pay

_Thank you for your cooperation!_
━━━━━━━━━━━━━━━━━━━━━━━`;

    const phone = borrower.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) {
      toast.error('Borrower does not have a valid phone number');
      return;
    }
    
    const baseUrl = `https://wa.me/${phone}`;
    const url = `${baseUrl}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  const handlePrintStatement = () => {
    setExportData({
      title: `Account Statement: ${borrower.name}`,
      filename: `Statement_${borrower.name.replace(/\s+/g, '_')}`,
      type: 'statement',
      columns: ['Issue Date', 'Purpose', 'Amount', 'Status'],
      rows: loans.map((l: any) => [
        new Date(l.loan_date).toLocaleDateString(),
        l.purpose,
        `₹${Number(l.loan_amount).toLocaleString()}`,
        l.status
      ])
    });
    setActiveModal('printExport');
    // Note: The PrintExportDrawer component needs to be updated to pass 'statement' type to the exportService,
    // but the exportData is already set to type 'statement' which the PrintExportDrawer passes to exportService.
    // The PrintExportDrawer.tsx needs to use the type from exportData in the handleExport call.
  };

  return (
    <PageContainer>
      <div className={styles.navBar}>
        <Link to="/borrowers" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Borrowers</span>
        </Link>
        <div className={styles.navActions}>
          <Button variant="ghost" size="sm" icon={<Phone size={16} />} onClick={handleContact}>Contact</Button>
          <Button variant="ghost" size="sm" icon={<Printer size={16} />} onClick={handlePrintStatement}>Print Statement</Button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.headerSection}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}>{borrower.name.charAt(0)}</div>
              <div className={styles.details}>
                <h1 className={styles.name}>{borrower.name}</h1>
                <div className={styles.meta}>
                  <span className={styles.phone}>{borrower.phone}</span>
                  {hasLoans && (
                    <>
                      <div className={styles.dot} />
                      <Badge variant={isOverdue ? 'danger' : 'success'} size="sm">{status}</Badge>
                      <div className={styles.dot} />
                      <Badge 
                        variant={
                          (isOverdue || borrower.risk_level === 'high') 
                            ? 'danger' 
                            : borrower.risk_level === 'medium' 
                              ? 'warning' 
                              : 'success'
                        } 
                        size="sm"
                      >
                        {(isOverdue || borrower.risk_level === 'high') 
                          ? 'High Risk' 
                          : borrower.risk_level === 'medium' 
                            ? 'Medium Risk' 
                            : 'Low Risk'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.heroOutstanding}>
              <span className={styles.balanceLabel}>Outstanding Balance</span>
              <div className={styles.balanceValue}>₹ {outstanding.toLocaleString()}</div>
            </div>
          </section>

          <div className={styles.overviewGrid}>
            <StatCard label="Total Loaned" value={`₹${totalLoaned.toLocaleString()}`} icon={<HandCoins />} variant="neutral" />
            <StatCard label="Total Recovered" value={`₹${totalRecovered.toLocaleString()}`} icon={<BadgeIndianRupee />} variant="success" />
            <StatCard label="Active Loans" value={loans.filter((l: any) => l.status === 'active').length.toString()} icon={<Scale />} variant="warning" />
            <StatCard label="Recovery Rate" value={`${totalLoaned > 0 ? ((totalRecovered / totalLoaned) * 100).toFixed(1) : 0}%`} icon={<TrendingUp />} variant="primary" />
          </div>

          <section className={styles.section}>
            <h3 className="label-sm mb-4">Operational Actions</h3>
            <div className={styles.actionsGrid}>
              <Button size="lg" icon={<HandCoins size={20} />} className={styles.actionBtn} onClick={() => openDrawer('external', { studentId: id })}>New Loan</Button>
              <Button size="lg" icon={<BadgeIndianRupee size={20} />} variant="soft" className={styles.actionBtn} onClick={() => openDrawer('recovery', { studentId: id })}>Record Recovery</Button>
              <Button size="lg" icon={<MessageCircle size={20} />} variant="success" className={styles.actionBtn} onClick={handleSendWhatsApp}>WhatsApp Statement</Button>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className="label-sm mb-4">Active Loan Portfolio</h3>
            <DataTable 
              columns={[
                { 
                  header: 'Issue Date', 
                  width: '120px',
                  accessor: (l: any) => (
                    <div className="flex flex-col">
                      <span>{new Date(l.loan_date).toLocaleDateString()}</span>
                      <span className="mobile-only-inline text-muted text-xs mt-1">
                        {l.purpose}
                      </span>
                    </div>
                  )
                },
                { 
                  header: 'Purpose', 
                  responsiveHidden: 'mobile',
                  accessor: 'purpose' 
                },
                { 
                  header: 'Loan Amount', 
                  accessor: (l: any) => (
                    <div className="flex flex-col items-end">
                      <span>₹{Number(l.loan_amount).toLocaleString()}</span>
                      <div className="mobile-only-flex mt-1">
                        <Badge variant={l.status === 'active' ? 'success' : 'danger'} size="sm">{l.status}</Badge>
                      </div>
                    </div>
                  ), 
                  align: 'right' 
                },
                { 
                  header: 'Status', 
                  responsiveHidden: 'mobile',
                  accessor: (l: any) => <Badge variant={l.status === 'active' ? 'success' : 'danger'} size="sm">{l.status}</Badge>, 
                  align: 'right' 
                },
                { 
                  header: 'Actions', 
                  width: '60px',
                  accessor: (l: any) => (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-danger"
                      onClick={() => {
                        openConfirmation({
                          title: 'Delete Loan Record?',
                          message: 'Are you sure you want to delete this loan record? This action cannot be undone.',
                          confirmLabel: 'Delete',
                          variant: 'danger',
                          onConfirm: () => deleteLoanMutation.mutate(l.id)
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  ),
                  align: 'right'
                }
              ]}
              data={loans}
            />
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.stickySection}>
            <Card padding="lg" className={clsx(styles.riskCard, hasLoans ? riskClass : '')}>
              <div className="flex-between mb-6">
                <h3 className="label-sm">Risk Assessment</h3>
                <div className="flex gap-1.5">
                  <Badge variant={hasLoans && isOverdue ? 'danger' : 'success'} pill>
                    {hasLoans ? status : 'No Active Loans'}
                  </Badge>
                  <Badge variant={hasLoans ? riskBadgeVariant : 'neutral'} pill>
                    {hasLoans ? riskLabel : 'No Exposure'}
                  </Badge>
                </div>
              </div>
              <div className={styles.riskInfo}>
                <div className={styles.riskScore}>
                  <div className={clsx(styles.rIcon, hasLoans ? riskClass : '')}>
                    <AlertTriangle size={28} />
                  </div>
                  <div className={styles.rVal}>
                    <strong>{hasLoans ? riskScoreLabel : 'Stable Ledger Profile'}</strong>
                    <span>{hasLoans ? riskScoreSub : 'No repayment risk active'}</span>
                  </div>
                </div>
                <p className={styles.riskDesc}>
                  {!hasLoans 
                    ? 'The borrower currently has no active loans. No repayment countdown or risk assessments are active.'
                    : isOverdue 
                      ? `The borrower has missed the repayment window and is ${lastRecoveryDays} days past their last recovery.` 
                      : baseRisk === 'high' 
                        ? 'The borrower is designated as a high-risk account.'
                        : baseRisk === 'medium'
                          ? 'The borrower has moderate risk settings.'
                          : 'The borrower is currently within safe repayment thresholds with low risk.'}
                </p>
              </div>
              
              {hasLoans && (
                <>
                  <div className={styles.divider} />
                  
                  <div className={styles.snapMeta}>
                    <div className={styles.mRow}>
                      <span>Calculated From</span>
                      <strong>{isCountdownFromRecovery ? 'Last Repayment' : 'First Loan Issued'}</strong>
                    </div>
                    <div className={styles.mRow}>
                      <span>Days Elapsed</span>
                      <strong>{lastRecoveryDays} days</strong>
                    </div>
                    <div className={styles.mRow}>
                      <span>Countdown Status</span>
                      {isOverdue ? (
                        <strong className="text-danger">Overdue by {lastRecoveryDays - limitDays} days</strong>
                      ) : (
                        <strong className="text-success">{limitDays - lastRecoveryDays} days left</strong>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className={styles.snapActions}>
                <Button fullWidth variant={isOverdue ? 'danger' : 'success'} onClick={handleSendWhatsApp}>WhatsApp Statement</Button>
                <Button fullWidth variant="soft" onClick={handlePrintStatement}>Print Statement</Button>
              </div>
            </Card>

            <h3 className="label-sm mt-8 mb-4">Loan Timeline</h3>
            <div className={styles.timeline}>
              {timeline.map((item: any, i: number) => (
                <div key={item.id} className={styles.tlItem}>
                  <div className={clsx(styles.tlIcon, styles[item.color])}>
                    {item.icon}
                  </div>
                  <div className={styles.tlContent}>
                    <div className={styles.tlHeader}>
                      <span className={styles.tlTitle}>{item.title}</span>
                      <span className={styles.tlTime}>{item.time}</span>
                    </div>
                    <span className={clsx(styles.tlAmount, item.color === 'danger' ? "text-danger" : "text-success")}>
                      {item.amount}
                    </span>
                  </div>
                  {i < timeline.length - 1 && <div className={styles.tlLine} />}
                </div>
              ))}
            </div>

            <h3 className="label-sm mt-8 mb-4">Recovery Insights</h3>
            <div className={styles.insights}>
              <Card padding="md" className={styles.insightItem}>
                <div className={clsx(styles.iIcon, styles.primary)}>
                  <Zap size={18} />
                </div>
                <div className={styles.iContent}>
                  <span className={styles.iLabel}>Payment Reliability</span>
                  <strong>{totalLoaned > 0 ? ((totalRecovered / totalLoaned) * 100).toFixed(0) : 0}%</strong>
                </div>
              </Card>
              <Card padding="md" className={styles.insightItem}>
                <div className={clsx(styles.iIcon, styles.warning)}>
                  <Target size={18} />
                </div>
                <div className={styles.iContent}>
                  <span className={styles.iLabel}>Active Loans</span>
                  <strong>{loans.filter((l: any) => l.status === 'active').length}</strong>
                </div>
              </Card>
            </div>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
};
