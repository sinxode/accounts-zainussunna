import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRight, 
  Search,
  Filter,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PillTabs } from '../../components/ui/PillTabs';
import { Avatar } from '../../components/ui/Avatar';
import { studentService } from '../../lib/services';
import { useAuth } from '../../contexts/AuthContext';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { exportService } from '../../lib/exportService';
import { useUIStore } from '../../store/useUIStore';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { StudentFilterDrawer } from './StudentFilterDrawer';
import type { StudentFilterState } from './StudentFilterDrawer';
import styles from './AllStudents.module.scss';
import { clsx } from 'clsx';

export const AllStudents: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { openDrawer } = useOperationsDrawer();
  const { setActiveModal, setExportData } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Full Advanced Multi-Criteria Filter State
  const [filters, setFilters] = useState<StudentFilterState>({
    status: 'all',
    health: 'all',
    category: 'all',
    customMin: '',
    customMax: ''
  });

  const canMutate = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['studentsSummary'],
    queryFn: studentService.getHealthSummary
  });

  // Extract available categories from student dataset
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [students]);

  // Comprehensive multi-factor filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        (s.name?.toLowerCase().includes(term)) ||
        (s.enrolment_no?.toLowerCase().includes(term));
      
      const balance = Number(s.current_balance) || 0;
      
      // Health & threshold filtering
      let matchesHealth = true;
      if (filters.health === 'negative') matchesHealth = balance < 0;
      else if (filters.health === 'positive') matchesHealth = balance > 0;
      else if (filters.health === 'zero') matchesHealth = balance === 0;
      else if (filters.health === 'under_200') matchesHealth = balance <= 200;
      else if (filters.health === 'under_500') matchesHealth = balance <= 500;

      // Custom numeric range
      let matchesCustomRange = true;
      if (filters.customMin !== '') {
        matchesCustomRange = matchesCustomRange && balance >= Number(filters.customMin);
      }
      if (filters.customMax !== '') {
        matchesCustomRange = matchesCustomRange && balance <= Number(filters.customMax);
      }

      // Status
      const matchesStatus = filters.status === 'all' || s.status === filters.status;

      // Category / Sheet
      const cat = (s.category || 'General').toLowerCase();
      const matchesCategory = filters.category === 'all' || cat === filters.category.toLowerCase();

      return matchesSearch && matchesHealth && matchesCustomRange && matchesStatus && matchesCategory;
    });
  }, [students, searchTerm, filters]);

  // Aggregate numbers computed strictly from the filtered view
  const totalBalance = filteredStudents.reduce((sum, s) => sum + (Number(s.current_balance) || 0), 0);
  const activeCount = filteredStudents.filter(s => s.status === 'active').length;
  const overdrawnCount = filteredStudents.filter(s => (Number(s.current_balance) || 0) < 0).length;

  // Active filter count (for badge on Filters button)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.health !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.customMin || filters.customMax) count++;
    return count;
  }, [filters]);

  // Active filter tags for 1-click removal
  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (filters.health === 'under_200') {
      tags.push({ label: 'Balance ≤ ₹200', onClear: () => setFilters(prev => ({ ...prev, health: 'all', customMax: '' })) });
    } else if (filters.health === 'under_500') {
      tags.push({ label: 'Balance ≤ ₹500', onClear: () => setFilters(prev => ({ ...prev, health: 'all', customMax: '' })) });
    } else if (filters.health === 'negative') {
      tags.push({ label: 'Overdrawn (< ₹0)', onClear: () => setFilters(prev => ({ ...prev, health: 'all' })) });
    } else if (filters.health === 'positive') {
      tags.push({ label: 'Positive (> ₹0)', onClear: () => setFilters(prev => ({ ...prev, health: 'all' })) });
    } else if (filters.health === 'zero') {
      tags.push({ label: 'Zero Balance (= ₹0)', onClear: () => setFilters(prev => ({ ...prev, health: 'all' })) });
    } else if (filters.customMin || filters.customMax) {
      const minTxt = filters.customMin ? `₹${filters.customMin}` : '₹0';
      const maxTxt = filters.customMax ? `₹${filters.customMax}` : '∞';
      tags.push({ label: `Balance: ${minTxt} – ${maxTxt}`, onClear: () => setFilters(prev => ({ ...prev, health: 'all', customMin: '', customMax: '' })) });
    }

    if (filters.category !== 'all') {
      tags.push({ label: `Category: ${filters.category}`, onClear: () => setFilters(prev => ({ ...prev, category: 'all' })) });
    }

    if (filters.status !== 'all') {
      tags.push({ label: `Status: ${filters.status}`, onClear: () => setFilters(prev => ({ ...prev, status: 'all' })) });
    }

    return tags;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      health: 'all',
      category: 'all',
      customMin: '',
      customMax: ''
    });
  };

  // Compute dynamic export metadata reflecting exact active filters
  const { exportTitle, exportFilename, exportFilterSummary } = useMemo(() => {
    const parts = [];
    if (filters.health === 'under_200') parts.push('Balance_Under_200');
    else if (filters.health === 'under_500') parts.push('Balance_Under_500');
    else if (filters.health === 'negative') parts.push('Overdrawn');
    else if (filters.health === 'positive') parts.push('Positive_Balance');
    else if (filters.customMax) parts.push(`Balance_Under_${filters.customMax}`);

    if (filters.category !== 'all') parts.push(filters.category);
    if (filters.status !== 'all') parts.push(filters.status);

    const dateStr = new Date().toISOString().split('T')[0];
    const desc = parts.length > 0 ? parts.join(' • ') : '';
    const filename = `ZLS_Students_${parts.length > 0 ? parts.join('_') + '_' : ''}${dateStr}`;
    const title = desc ? `Student Directory (${desc.replace(/_/g, ' ')})` : 'Student Directory';

    return {
      exportTitle: title,
      exportFilename: filename,
      exportFilterSummary: desc.replace(/_/g, ' ') || 'All Registered Students'
    };
  }, [filters]);

  const exportColumns = ['Enrolment No', 'Name', 'Category', 'Balance', 'Status'];
  const exportRows = useMemo(() => {
    return filteredStudents.map((s: any) => [
      s.enrolment_no || '',
      s.name,
      s.category || 'General',
      `₹${(Number(s.current_balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      s.status || 'active'
    ]);
  }, [filteredStudents]);

  const handleExportCSV = () => {
    exportService.exportToCSV(exportTitle, exportColumns, exportRows, exportFilename);
  };

  const handleExportExcel = () => {
    exportService.exportToExcel(exportTitle, exportColumns, exportRows, exportFilename);
  };

  const handleExportPDF = () => {
    exportService.exportToPDF(exportTitle, exportColumns, exportRows, exportFilename, 'student_directory');
  };

  const handleOpenExportDrawer = () => {
    setExportData({
      title: exportTitle,
      filename: exportFilename,
      type: 'student_directory',
      filterSummary: exportFilterSummary,
      columns: exportColumns,
      rows: exportRows
    });
    setActiveModal('printExport');
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Row */}
      <div className={styles.controlsRow}>
        <div className={styles.navGroup}>
          <PillTabs
            value={filters.status}
            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            variant="lime"
            options={[
              { value: 'all', label: 'All Students', count: students.length },
              { value: 'active', label: 'Active', count: activeCount },
              { value: 'archived', label: 'Archived' },
            ]}
          />

          <PillTabs
            value={filters.health}
            onChange={(val) => setFilters(prev => ({ 
              ...prev, 
              health: val, 
              customMax: val === 'under_200' ? '200' : val === 'under_500' ? '500' : '' 
            }))}
            variant="subtle"
            size="sm"
            options={[
              { value: 'all', label: 'All Ledgers' },
              { value: 'under_200', label: '≤ ₹200 (Low)' },
              { value: 'negative', label: 'Overdrawn', count: students.filter(s => (Number(s.current_balance) || 0) < 0).length },
              { value: 'positive', label: 'Positive' },
            ]}
          />
        </div>

        <div className={styles.actionGroup}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              className={styles.inlineSearch}
              placeholder="Search by name or enrolment..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Advanced Filters Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<Filter size={14} />}
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterCountBadge}>{activeFilterCount}</span>
            )}
          </Button>

          {/* Export Menu with Direct Downloads & Universal Drawer Access */}
          <ExportMenu
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onOpenDrawer={handleOpenExportDrawer}
            size="sm"
          />

          {canMutate && (
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Plus size={16} />} 
              onClick={() => setActiveModal('addStudent')}
            >
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Removable Tags Bar */}
      {activeFilterTags.length > 0 && (
        <div className={styles.activeFiltersBar}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Active:
          </span>
          {activeFilterTags.map((tag, idx) => (
            <span key={idx} className={styles.filterTagPill}>
              <span>{tag.label}</span>
              <button 
                type="button" 
                className={styles.removeTagBtn}
                onClick={tag.onClear}
                aria-label={`Remove filter ${tag.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button 
            type="button" 
            className={styles.clearAllBtn}
            onClick={handleResetFilters}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Compact Summary Strip */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Students</span>
          <span className={styles.summaryValue}>{filteredStudents.length}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Ledger Funds</span>
          <span className={clsx(styles.summaryValue, styles.credit)}>
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Overdrawn Accounts</span>
          <span className={clsx(styles.summaryValue, overdrawnCount > 0 ? styles.debit : styles.neutral)}>
            {overdrawnCount} {overdrawnCount > 0 ? 'requiring recovery' : 'healthy'}
          </span>
        </div>
      </div>

      {/* Students Card List Container */}
      <Card padding="none" className={styles.tableCard}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading student directory...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No students found matching your search.
          </div>
        ) : (
          <div className={styles.studentList}>
            {filteredStudents.map((s: any) => {
              const bal = Number(s.current_balance || 0);
              const isNeg = bal < 0;

              return (
                <div 
                  key={s.id} 
                  className={styles.studentRowCard}
                  onClick={() => navigate(`/students/${s.id}`)}
                >
                  <div className={styles.studentPrimary}>
                    <Avatar name={s.name} size="sm" />
                    <div className={styles.details}>
                      <span className={styles.name}>{s.name}</span>
                      <div className={styles.metaLine}>
                        <span className={styles.enrollment}>{s.enrolment_no}</span>
                        <span className={styles.mobileCategory}>• {s.category || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.studentCategory}>
                    <Badge variant={s.category === "da'wa" ? 'da_wa' : 'hifz'} size="sm">
                      {s.category || 'General'}
                    </Badge>
                  </div>

                  <div className={styles.studentBalance}>
                    <span className={styles.balanceLabel}>Current Balance</span>
                    <span className={clsx(styles.balanceValue, isNeg ? styles.debit : styles.credit)}>
                      {isNeg ? '−' : ''}₹{Math.abs(bal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    {isNeg && (
                      <span className={styles.overdrawnTag}>Overdrawn</span>
                    )}
                  </div>

                  <div className={styles.studentStatus}>
                    <Badge variant={s.status === 'active' ? 'active' : 'neutral'} size="sm">
                      {s.status}
                    </Badge>
                  </div>

                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {canMutate && (
                      <>
                        <button 
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openDrawer('deposit', { studentId: s.id })} 
                          title="Record Deposit"
                        >
                          <ArrowDownLeft size={15} />
                        </button>
                        <button 
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openDrawer('withdrawal', { studentId: s.id })} 
                          title="Record Withdrawal"
                        >
                          <ArrowUpRight size={15} />
                        </button>
                      </>
                    )}
                    <button 
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => navigate(`/students/${s.id}`)} 
                      title="View Student Profile"
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Advanced Filter Slide-over Drawer */}
      <StudentFilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        matchingCount={filteredStudents.length}
        totalCount={students.length}
        availableCategories={availableCategories}
      />
    </div>
  );
};
