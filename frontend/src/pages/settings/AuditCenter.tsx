import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  User, 
  Database, 
  Clock,
  History,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../lib/adminService';
import { useUIStore } from '../../store/useUIStore';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import styles from './AuditCenter.module.scss';

export const AuditCenter: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { setExportData, setActiveModal } = useUIStore();

  const { data: rawLogs = [], isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => adminService.getAuditLogs(200),
  });

  const logs = rawLogs.map((l: any) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    user: l.profiles?.full_name || 'System',
    time: new Date(l.created_at).toLocaleString(),
    status: l.action.includes('ERROR') || l.action.includes('FAIL') ? 'alert' : 'verified',
    entity_id: l.entity_id,
    old_values: l.old_values,
    new_values: l.new_values
  }));

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.entity_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    setExportData({
      title: 'Audit System Log Export',
      filename: `Audit_Log_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Timestamp', 'User', 'Action', 'Entity', 'ID', 'Status'],
      rows: filteredLogs.map(l => [
        l.time,
        l.user,
        l.action,
        l.entity,
        l.entity_id,
        l.status
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Audit Center" 
        subtitle="Immutable ledger of every administrative and financial action."
        actions={<Button variant="soft" icon={<Download size={18} />} onClick={handleExport}>Export Audit Log</Button>}
      />

      <div className={styles.container}>
        <Card padding="sm" className={styles.filterCard}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by action, user, or entity ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="soft" icon={<Filter size={18} />}>Advanced Filters</Button>
          </div>
        </Card>

        <Card padding="none" className={styles.tableCard}>
          {isLoading ? (
            <div className="flex-center p-8 text-muted">Loading audit history...</div>
          ) : (
            <DataTable 
              columns={[
                { 
                  header: 'Timestamp', 
                  accessor: (l) => (
                    <div className={styles.timeCell}>
                      <Clock size={14} />
                      <span>{l.time}</span>
                    </div>
                  )
                },
                { 
                  header: 'User', 
                  accessor: (l) => (
                    <div className={styles.userCell}>
                      <User size={14} />
                      <span>{l.user}</span>
                    </div>
                  )
                },
                { 
                  header: 'Action', 
                  accessor: (l) => (
                    <Badge variant={l.action.includes('CREATE') ? 'success' : l.action.includes('REVERSE') ? 'danger' : 'info'} size="sm">
                      {l.action.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                { 
                  header: 'Entity', 
                  accessor: (l) => (
                    <div className={styles.entityCell}>
                      <Database size={14} />
                      <span>{l.entity}</span>
                    </div>
                  )
                },
                { 
                  header: 'ID', 
                  accessor: (l) => <code className={styles.idCode}>{l.entity_id}</code>
                },
                { 
                  header: 'Status', 
                  accessor: (l) => (
                    <Badge variant={l.status === 'verified' ? 'success' : 'warning'} size="sm" pill>
                      {l.status}
                    </Badge>
                  )
                },
                { 
                  header: '', 
                  accessor: (l) => (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(l)}>
                      <Eye size={16} />
                    </Button>
                  ),
                  align: 'right'
                }
              ]}
              data={filteredLogs}
            />
          )}
        </Card>
      </div>

      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="Audit Investigation"
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
                <label className="label-sm">Global ID</label>
                <code>{selectedLog.id}</code>
              </div>
            </div>

            <div className={styles.comparison}>
              <div className={styles.compSection}>
                <label className="label-sm mb-4">Previous State</label>
                <div className={styles.jsonBox}>
                  <pre>{selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : '{\n  "state": "N/A (Created)"\n}'}</pre>
                </div>
              </div>
              <div className={styles.compSection}>
                <label className="label-sm mb-4">Updated State</label>
                <div className={`${styles.jsonBox} ${styles.highlighted}`}>
                  <pre>{selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : '{\n  "state": "N/A (Deleted)"\n}'}</pre>
                </div>
              </div>
            </div>

            <div className={styles.inspectFooter}>
              <div className={styles.reason}>
                <label className="label-sm">Target Entity ID</label>
                <p><code>{selectedLog.entity_id}</code></p>
              </div>
              <Button variant="soft" icon={<History size={16} />} onClick={() => { setSearchTerm(selectedLog.entity_id); setSelectedLog(null); }}>View Related Logs</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};
