import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { DrawerLayout } from '../operations/drawers/DrawerLayout';
import toast from 'react-hot-toast';
import styles from '../operations/drawers/DrawerStyles.module.scss';
import { useQueryClient } from '@tanstack/react-query';

export const AddStudentDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', enrolment_no: '', status: 'active' as 'active' | 'archived' });

  const handleClear = () => {
    setForm({ name: '', enrolment_no: '', status: 'active' });
  };

  const handleSubmit = async (shouldClose: boolean = true) => {
    if (!form.name || !form.enrolment_no) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const cleanedName = form.name.replace(/^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+/i, '');
      const { error } = await supabase.from('students').insert([{
        ...form,
        name: cleanedName
      }]);
      if (error) throw error;
      toast.success('Student added successfully');
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      if (shouldClose) {
        onClose();
      } else {
        handleClear();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerLayout
      title="Add New Student"
      subtitle="Register a new student in the ledger system"
      icon={<UserPlus className="text-white" />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div className="flex w-full gap-2">
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(false)} 
            loading={loading} 
            className="flex-1"
          >
            Save & Next
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(true)} 
            loading={loading} 
            className="flex-1"
          >
            Save & Close
          </Button>
        </div>
      }
    >
      <form 
        className={styles.drawerContent} 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(true);
        }}
      >
        <Input 
          label="Full Name" 
          placeholder="e.g. Abdullah bin Ahmed"
          value={form.name} 
          onChange={(e) => setForm({...form, name: e.target.value})} 
          required 
        />
        <Input 
          label="Enrollment Number" 
          placeholder="e.g. ENR/2026/001"
          value={form.enrolment_no} 
          onChange={(e) => setForm({...form, enrolment_no: e.target.value})} 
          required 
        />
        
        <div className={styles.statusGroup}>
          <label className={styles.statusLabel}>Initial Account Status</label>
          <div className={styles.statusToggle}>
            <Button 
              type="button" 
              variant={form.status === 'active' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setForm({...form, status: 'active'})}
            >
              Active
            </Button>
            <Button 
              type="button" 
              variant={form.status === 'archived' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setForm({...form, status: 'archived'})}
            >
              Archived
            </Button>
          </div>
        </div>
      </form>
    </DrawerLayout>
  );
};
