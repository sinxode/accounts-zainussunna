import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Filter, Plus, Trash2, ArrowRight } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { clsx } from 'clsx';

export const StudentSelectionEngine: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const availableStudents = [
    { id: '1', name: 'Mohammed Ali', enroll: 'ENR-2023-001', balance: '₹0.00', health: 'Healthy' },
    { id: '2', name: 'Ahmed Hassan', enroll: 'ENR-2023-002', balance: '-₹1,500', health: 'Negative' },
    { id: '3', name: 'Zainab Fatima', enroll: 'ENR-2023-003', balance: '₹5,000', health: 'Healthy' },
    { id: '4', name: 'Omar Farooq', enroll: 'ENR-2023-004', balance: '₹200', health: 'Low Balance' },
  ];

  const handleSelect = (id: string) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemove = (id: string) => {
    setSelectedIds(selectedIds.filter(sId => sId !== id));
  };

  return (
    <div className={styles.selectionEngine}>
      <div className={styles.engineTopPanel}>
        <div className="flex justify-between items-center w-full">
          <div>
            <h4 className="font-bold text-primary">Student Selection</h4>
            <p className="text-sm text-muted">{selectedIds.length} Students Selected</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Select All</Button>
            <Button variant="ghost" size="sm">Clear Selection</Button>
            <Button variant="soft" size="sm" icon={<Plus size={14} />}>Import CSV</Button>
          </div>
        </div>
      </div>

      <div className={styles.enginePanels}>
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h5 className="font-bold text-sm">Available Students</h5>
            <div className="flex gap-2 mt-2">
              <Input 
                placeholder="Search students..." 
                className="flex-1" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="ghost" icon={<Filter size={14} />} />
            </div>
          </div>
          <div className={styles.panelList}>
            {availableStudents
              .filter(s => !selectedIds.includes(s.id))
              .filter(s => 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.enroll.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(student => (
              <div key={student.id} className={styles.studentItem}>
                <div className="flex items-center gap-3">
                  <div className={styles.avatar}>{student.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold">{student.name}</div>
                    <div className="text-xs text-muted">{student.enroll}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold">{student.balance}</div>
                    <div className={clsx("text-xs", student.health === 'Negative' ? 'text-danger' : student.health === 'Low Balance' ? 'text-warning' : 'text-success')}>
                      {student.health}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} onClick={() => handleSelect(student.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.panelHeader}>
            <h5 className="font-bold text-sm text-primary">Selected for Batch</h5>
          </div>
          <div className={styles.panelList}>
            {availableStudents.filter(s => selectedIds.includes(s.id)).map(student => (
              <div key={student.id} className={styles.studentItem}>
                <div className="flex items-center gap-3">
                  <div className={styles.avatar}>{student.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold text-primary">{student.name}</div>
                    <div className="text-xs text-muted">{student.enroll}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-danger" icon={<Trash2 size={14} />} onClick={() => handleRemove(student.id)} />
              </div>
            ))}
            {selectedIds.length === 0 && (
              <div className="text-sm text-muted text-center py-8">
                No students selected yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
