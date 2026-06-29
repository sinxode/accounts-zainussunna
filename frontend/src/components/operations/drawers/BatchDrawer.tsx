import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { UsersRound, Trash2, Search, Info, Save } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import styles from './DrawerStyles.module.scss';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { batchService } from '../../../lib/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../../store/useUIStore';

export const BatchDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const openConfirmation = useUIStore(state => state.openConfirmation);

  const handleClear = () => {
    openConfirmation({
      title: 'Reset Form?',
      message: 'Are you sure you want to reset the form? All entered details and selected students will be cleared.',
      confirmLabel: 'Reset',
      variant: 'warning',
      onConfirm: () => {
        setName('');
        setDescription('');
        setSelectedStudents([]);
      }
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Auth required');
      
      const batch = await batchService.create({
        name,
        description,
        created_by: user.id
      });

      if (selectedStudents.length > 0) {
        await batchService.addMembers(batch.id, selectedStudents.map(s => s.id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleAddStudent = (student: any) => {
    if (selectedStudents.find(s => s.id === student.id)) {
      toast.error('Student already in batch');
      return;
    }
    setSelectedStudents([student, ...selectedStudents]);
  };

  const removeStudent = (id: string) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const handleSubmit = () => {
    if (!name) return toast.error('Batch name is required');
    if (selectedStudents.length === 0) return toast.error('Add students to the batch');
    createMutation.mutate();
  };

  return (
    <DrawerLayout
      title="Create Batch"
      subtitle="Define a custom group of students"
      icon={<UsersRound className="text-white" />}
      onClose={onClose}
      onClear={handleClear}
      footer={<Button variant="primary" onClick={handleSubmit} loading={createMutation.isPending} fullWidth>Create Batch Profile</Button>}
    >
      <div className={styles.drawerContent}>
        {/* Section 1: Configuration */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>1</span>
            Batch Identity
          </div>
          
          <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col gap-5">
            <Input 
              label="Batch Name" 
              placeholder="e.g. Zakaath Group - 2026" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              icon={<Save size={16} />}
            />
            <Input 
              label="Description (Optional)" 
              placeholder="What is this group for?" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              icon={<Info size={16} />}
            />
          </div>
        </section>

        {/* Section 2: Student Selection */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>2</span>
            Selection Engine
          </div>

          <div className={styles.selectionArea}>
            <StudentSearch 
              placeholder="Search and link students..." 
              onSelect={handleAddStudent} 
              clearOnSelect={true}
            />

            <div className={styles.listHeader}>
              <span>Selected Members ({selectedStudents.length})</span>
              {selectedStudents.length > 0 && (
                <span onClick={() => setSelectedStudents([])} className="text-danger cursor-pointer hover:underline">
                  Clear All
                </span>
              )}
            </div>

            <div className={styles.participantList}>
              {selectedStudents.map(student => (
                <div key={student.id} className={styles.participantItem}>
                  <div className={styles.pInfo}>
                    <div className={styles.pAvatar}>
                      {student.name.charAt(0)}
                    </div>
                    <div className={styles.pDetails}>
                      <span className={styles.pName}>{student.name}</span>
                      <span className={styles.pEnr}>{student.enrolment_no}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeStudent(student.id)} 
                    className={styles.removeBtn}
                    icon={<Trash2 size={14} />}
                  />
                </div>
              ))}

              {selectedStudents.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <Search size={24} />
                  </div>
                  <div className={styles.emptyTitle}>Empty List</div>
                  <p className={styles.emptyDesc}>Add students above to build your batch profile.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Global Summary Note */}
        <div className={styles.infoBox}>
          <UsersRound size={20} className="text-primary" />
          <p>
            Batches allow you to perform bulk operations with a single click in the <strong>Bulk Workspace</strong>.
          </p>
        </div>
      </div>
    </DrawerLayout>
  );
};
