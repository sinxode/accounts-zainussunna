import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Layers, 
  Landmark, 
  History, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Receipt,
  Scale,
  Copy,
  ChevronRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { Drawer } from '../../components/ui/Drawer';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { transactionService, studentService, borrowerService } from '../../lib/services';
import styles from './OperationsCenter.module.scss';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const OperationsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Queries for live account data
  const { data: students = [] } = useQuery({
    queryKey: ['studentsSummary'],
    queryFn: studentService.getHealthSummary
  });

  const { data: borrowers = [] } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowerService.list
  });

  const { data: todayStats } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: () => transactionService.getTodaySummary()
  });

  const { data: recentOps = [], isLoading: isLoadingOps } = useQuery({
    queryKey: ['recentOperationsUnified'],
    queryFn: () => transactionService.listAllUnified(10)
  });

  // Calculate live institutional ledger balances
  const studentLiability = students.reduce((sum, s) => sum + (Number(s.current_balance) || 0), 0);
  const activeStudentsCount = students.filter(s => s.status === 'active').length;

  const borrowerExposure = borrowers.reduce((acc: number, b: any) => {
    const totalLoaned = b.borrower_loans?.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) || 0;
    const totalRecovered = b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0;
    return acc + (totalLoaned - totalRecovered);
  }, 0);

  const totalCredits = recentOps.filter((t: any) => t.direction === 'credit' && !t.is_reversed).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const totalDebits = recentOps.filter((t: any) => t.direction === 'debit' && !t.is_reversed).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  
  // Total institutional cash in hand (Student pool held in physical vault)
  const vaultCash = studentLiability;
  const totalInstitutionalAssets = studentLiability + borrowerExposure;

  const todayMoneyIn = todayStats?.moneyIn ?? 0;
  const todayMoneyOut = todayStats?.moneyOut ?? 0;
  const todayNet = todayMoneyIn - todayMoneyOut;

  const copyVaultId = () => {
    navigator.clipboard?.writeText('ZLS-VAULT-01');
    toast.success('Vault ID copied to clipboard');
  };

  return (
    <PageContainer>
      <div className={styles.container}>
        {/* 1. Siburian Finance Benchmark Treasury Duo */}
        <div className={styles.treasuryRow}>
          {/* Left: Active Cash Vault Hero Card */}
          <div className={styles.heroCard}>
            <div className={styles.heroTop}>
              <div className={styles.accountBadgeGroup}>
                <span className={styles.currencyPill}>
                  <span>🇮🇳</span>
                  <span>INR · CASH VAULT</span>
                </span>
                <Badge variant="success" size="sm" pill>● Verified Float</Badge>
              </div>
              <div className={styles.accountMeta} onClick={copyVaultId} style={{ cursor: 'pointer' }}>
                <span>Vault #ZLS-01</span>
                <Copy size={13} />
              </div>
            </div>

            <div className={styles.balanceBlock}>
              <span className={styles.balanceLabel}>Active Cash In Hand</span>
              <div className={styles.balanceAmountRow}>
                <span className={styles.balanceAmount}>
                  ₹{vaultCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.primaryActions}>
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={<ArrowDownLeft size={16} strokeWidth={2.5} />}
                  onClick={() => openDrawer('deposit')}
                >
                  Deposit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  icon={<ArrowUpRight size={16} strokeWidth={2} />}
                  onClick={() => openDrawer('withdrawal')}
                >
                  Withdraw
                </Button>
                <Button 
                  variant="soft" 
                  size="sm"
                  icon={<ArrowLeftRight size={15} />}
                  onClick={() => openDrawer('internal')}
                >
                  Transfer
                </Button>
              </div>

              <button 
                className={styles.circleLinkBtn} 
                onClick={() => navigate('/transactions')}
                title="View Full Transaction Ledger"
              >
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          {/* Right: Institutional Capital Allocation (Lime Card) */}
          <div className={styles.capitalCard}>
            <div className={styles.capitalTop}>
              <span className={styles.capitalLabel}>INSTITUTIONAL CAPITAL</span>
              <span className={styles.capitalDelta}>100% Balanced</span>
            </div>

            <div className={styles.capitalAmountRow}>
              <span className={styles.capitalAmount}>
                ₹{totalInstitutionalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.capitalTiles}>
              <div className={styles.capitalTile} onClick={() => navigate('/students')}>
                <div className={styles.tileHeader}>
                  <span className={styles.tileLabel}>Student Pool</span>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <strong className={styles.tileValue}>
                  ₹{studentLiability.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </strong>
                <span className={styles.tileSub}>{activeStudentsCount} Active Accounts</span>
              </div>

              <div className={styles.capitalTile} onClick={() => navigate('/borrowers')}>
                <div className={styles.tileHeader}>
                  <span className={styles.tileLabel}>Receivables</span>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <strong className={styles.tileValue}>
                  ₹{borrowerExposure.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </strong>
                <span className={styles.tileSub}>{borrowers.length} Active Debtors</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Secondary Fast Operation Pills */}
        <div className={styles.operationsToolbar}>
          <Button 
            variant="soft" 
            size="sm"
            icon={<Layers size={14} />}
            onClick={() => openDrawer('bulk')}
          >
            Bulk Ledger Entry
          </Button>
          <Button 
            variant="soft" 
            size="sm"
            icon={<Landmark size={14} />}
            onClick={() => openDrawer('external')}
          >
            Outside Loan
          </Button>
          <Button 
            variant="soft" 
            size="sm"
            icon={<History size={14} />}
            onClick={() => openDrawer('recovery')}
          >
            Loan Recovery
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            icon={<ArrowLeftRight size={14} />}
            onClick={() => navigate('/internal-transfers')}
          >
            Internal Transfers
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            icon={<Layers size={14} />}
            onClick={() => navigate('/batches')}
          >
            Batch Groups
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/presets')}
          >
            Entry Presets
          </Button>
        </div>

        {/* 3. Split Layout: Journal + Sidecard */}
        <div className={styles.workspaceLayout}>
          {/* Left: Recent Ledger Journal */}
          <div className={styles.journalCard}>
            <div className={styles.journalHeader}>
              <div className={styles.journalTitle}>
                <Receipt size={17} />
                <span>Recent Ledger Journal</span>
              </div>
              <Link to="/transactions" className={styles.viewAllLink}>
                <span>View All Records</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {isLoadingOps ? (
              <div className={styles.emptyState}>Loading recent transactions...</div>
            ) : recentOps.length === 0 ? (
              <div className={styles.emptyState}>No recent transactions found.</div>
            ) : (
              <div className={styles.journalList}>
                {recentOps.map((t: any) => (
                  <TransactionRow
                    key={t.id}
                    id={t.id}
                    type={t.type}
                    direction={t.direction}
                    amount={t.amount}
                    purpose={t.purpose}
                    studentName={t.entity_name}
                    accountName={t.entity_sub}
                    date={t.date}
                    status={t.is_reversed ? 'reversed' : 'active'}
                    onClick={() => setSelectedTx(t)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Integrity & Workspace Tools */}
          <div className={styles.sideColumn}>
            {/* Ledger Integrity Card */}
            <div className={styles.integrityCard}>
              <div className={styles.integrityHeader}>
                <div className={styles.integrityTitle}>
                  <Scale size={16} />
                  <span>Ledger Integrity</span>
                </div>
                <Badge variant="success" size="sm" pill>● Balanced</Badge>
              </div>

              <div className={styles.integrityRows}>
                <div className={styles.integrityRow}>
                  <span className={styles.iLabel}>Today's Net Flow</span>
                  <span className={clsx(styles.iVal, todayNet >= 0 ? styles.credit : styles.debit)}>
                    {todayNet >= 0 ? '+' : '−'}₹{Math.abs(todayNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.integrityRow}>
                  <span className={styles.iLabel}>Active Journal Credits</span>
                  <span className={clsx(styles.iVal, styles.credit)}>
                    +₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.integrityRow}>
                  <span className={styles.iLabel}>Active Journal Debits</span>
                  <span className={clsx(styles.iVal, styles.debit)}>
                    −₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={styles.integrityDivider} />
                <div className={styles.integrityRow}>
                  <span className={styles.iLabel} style={{ fontWeight: 600, color: 'var(--text-strong)' }}>Total Capital</span>
                  <span className={styles.iVal} style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
                    ₹{totalInstitutionalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<ShieldCheck size={15} />}
                onClick={() => navigate('/reports/cashbook')}
              >
                Run Cashbook Audit
              </Button>
            </div>

            {/* Institutional Workspaces Card */}
            <div className={styles.navCard}>
              <span className={styles.navCardTitle}>Quick Workspaces</span>
              <div className={styles.workspaceLinks}>
                <Link to="/internal-transfers" className={styles.wLink}>
                  <div className={styles.wLinkLeft}>
                    <ArrowLeftRight size={14} />
                    <span>Internal Student Lending</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
                <Link to="/batches" className={styles.wLink}>
                  <div className={styles.wLinkLeft}>
                    <Layers size={14} />
                    <span>Batch Distribution Groups</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
                <Link to="/presets" className={styles.wLink}>
                  <div className={styles.wLinkLeft}>
                    <TrendingUp size={14} />
                    <span>Saved Entry Presets</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Transaction Receipt Drawer */}
        {selectedTx && (
          <Drawer
            isOpen={!!selectedTx}
            onClose={() => setSelectedTx(null)}
            title="Transaction Receipt"
            subtitle={`Reference: ${selectedTx.id.slice(0, 12)}`}
          >
            <div className={styles.drawerReceiptBody}>
              <div className={styles.receiptHeader}>
                <div className={styles.receiptIcon}>
                  {selectedTx.direction === 'credit' ? <ArrowDownLeft size={26} /> : <ArrowUpRight size={26} />}
                </div>
                <span className={styles.receiptAmount}>
                  {selectedTx.direction === 'credit' ? '+' : '−'}₹{Number(selectedTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={styles.receiptPurpose}>{selectedTx.purpose || 'General Entry'}</span>
                <Badge variant={selectedTx.is_reversed ? 'danger' : 'success'} size="sm" pill>
                  {selectedTx.is_reversed ? 'Reversed' : 'Verified Balanced'}
                </Badge>
              </div>

              <div className={styles.receiptMeta}>
                <div className={styles.metaRow}>
                  <span>Account / Student</span>
                  <strong>{selectedTx.entity_name || '—'}</strong>
                </div>
                <div className={styles.metaRow}>
                  <span>Type</span>
                  <strong style={{ textTransform: 'capitalize' }}>{selectedTx.type}</strong>
                </div>
                <div className={styles.metaRow}>
                  <span>Date & Time</span>
                  <strong>{new Date(selectedTx.date).toLocaleString()}</strong>
                </div>
                <div className={styles.metaRow}>
                  <span>Transaction ID</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{selectedTx.id}</span>
                </div>
              </div>
            </div>
          </Drawer>
        )}
      </div>
    </PageContainer>
  );
};
