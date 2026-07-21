import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  PlayCircle,
  IndianRupee,
  Type,
  FileText,
  BadgeInfo,
  Layers,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Target,
  Calendar,
  Send,
  Download,
  ShoppingBag,
  Award,
  PiggyBank,
  Sliders
} from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import styles from './PresetDrawer.module.scss';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { presetService, batchService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useOperationsDrawer } from './OperationsDrawerContext';

const CATEGORIES = [
  'Monthly',
  'Distribution',
  'Collection',
  'Store',
  'Scholarship',
  'Savings',
  'Custom'
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Monthly: <Calendar size={14} />,
  Distribution: <Send size={14} />,
  Collection: <Download size={14} />,
  Store: <ShoppingBag size={14} />,
  Scholarship: <Award size={14} />,
  Savings: <PiggyBank size={14} />,
  Custom: <Sliders size={14} />
};

export const PresetDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { openDrawer, drawerData } = useOperationsDrawer();
  const editingPreset = drawerData?.preset;
  const isEditMode = drawerData?.mode === 'edit' || !!editingPreset;

  const [name, setName] = useState(editingPreset?.name || '');
  const [description, setDescription] = useState(editingPreset?.description || '');
  const [category, setCategory] = useState(editingPreset?.category || 'Monthly');
  const [targetMode, setTargetMode] = useState<'batch' | 'fixed' | 'shortcut'>(
    editingPreset?.configuration?.participants?.length ? 'fixed' : editingPreset?.configuration?.batch_id ? 'batch' : 'shortcut'
  );
  
  // Default Values State
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [fixedParticipants, setFixedParticipants] = useState<any[]>(editingPreset?.configuration?.participants || []);
  const [amount, setAmount] = useState(
    editingPreset?.configuration?.amount ?? editingPreset?.amount ? String(editingPreset?.configuration?.amount ?? editingPreset?.amount) : ''
  );
  const [purpose, setPurpose] = useState(editingPreset?.configuration?.purpose || editingPreset?.purpose || '');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>(
    editingPreset?.configuration?.type || editingPreset?.transaction_type || 'deposit'
  );
  const [notes, setNotes] = useState(editingPreset?.configuration?.notes || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: batchService.list
  });

  useEffect(() => {
    if (editingPreset?.configuration?.batch_id && batches.length > 0) {
      const b = batches.find((item: any) => item.id === editingPreset.configuration.batch_id);
      if (b) setSelectedBatch(b);
    }
  }, [editingPreset, batches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setName('');
    setDescription('');
    setSelectedBatch(null);
    setAmount('');
    setPurpose('');
    setNotes('');
    setCategory('Monthly');
    setTxType('deposit');
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditMode && editingPreset?.id
      ? presetService.update(editingPreset.id, data)
      : presetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast.success(isEditMode ? 'Preset updated successfully' : 'Preset created successfully');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSubmit = async (runAfter = false, shouldClose = true) => {
    if (!name) return toast.error('Preset name is required');
    
    const configuration = {
      target_mode: targetMode,
      batch_id: targetMode === 'batch' ? selectedBatch?.id : undefined,
      batch_name: targetMode === 'batch' ? selectedBatch?.name : undefined,
      participants: targetMode === 'fixed' ? fixedParticipants.map(p => ({
        student_id: p.student_id,
        name: p.name,
        enrolment_no: p.enrolment_no,
        amount: p.amount ? parseFloat(String(p.amount)) : (amount ? parseFloat(amount) : 0),
        type: txType
      })) : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      purpose: purpose || undefined,
      type: txType,
      notes: notes || undefined
    };

    const presetData = {
      name,
      description,
      configuration,
      transaction_type: txType,
      amount: amount ? parseFloat(amount) : null,
      purpose: purpose || null
    };

    try {
      await saveMutation.mutateAsync(presetData);
      
      if (runAfter) {
        openDrawer('bulk', { preset: presetData });
      } else {
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    } catch (err) {
      // Error handled by mutation
    }
  };

  const defaultsCount = useMemo(() => {
    let count = 0;
    if (selectedBatch) count++;
    if (amount) count++;
    if (purpose) count++;
    if (txType) count++;
    if (notes) count++;
    return count;
  }, [selectedBatch, amount, purpose, txType, notes]);

  return (
    <DrawerLayout
      title={isEditMode ? 'Edit Preset' : 'Create Preset'}
      subtitle={isEditMode ? 'Update preset configuration shortcuts' : 'Define reusable shortcuts for your operations'}
      icon={<PlusCircle className="text-white" size={24} />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div className="flex w-full gap-2">
          {!isEditMode && (
            <Button 
              variant="secondary" 
              onClick={() => handleSubmit(false, false)} 
              loading={saveMutation.isPending} 
              className="flex-1"
            >
              Save & Next
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(false, true)} 
            loading={saveMutation.isPending} 
            className="flex-1"
          >
            {isEditMode ? 'Update Preset' : 'Save & Close'}
          </Button>
        </div>
      }
    >
      <div className={styles.presetDrawer}>
        {/* Section 1: Preset Information */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <BadgeInfo size={14} /> Preset Information
          </div>
          
          <div className={styles.card}>
            <div className="flex flex-col gap-5">
              <Input 
                label="Preset Name" 
                placeholder="e.g. Monthly Zakaath" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                fullWidth
              />
              
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Preset Category</label>
                
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={styles.dropdownTrigger}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={styles.triggerIcon}>
                      {CATEGORY_ICONS[category] || <Target size={16} />}
                    </span>
                    <span className="font-semibold text-sm">{category}</span>
                  </div>
                  <ChevronDown size={18} className={clsx(styles.chevron, isDropdownOpen && styles.chevronOpen)} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      className={styles.dropdownMenu}
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      {CATEGORIES.map(cat => {
                        const isActive = category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCategory(cat);
                              setIsDropdownOpen(false);
                            }}
                            className={clsx(
                              styles.dropdownItem,
                              isActive && styles.activeItem
                            )}
                          >
                            <span className={styles.itemIcon}>
                              {CATEGORY_ICONS[cat] || <Target size={14} />}
                            </span>
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Input 
                label="Description (Optional)" 
                placeholder="Briefly describe when to use this preset" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* Section 2: Target & Default Values */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <Target size={14} /> Target & Default Values
          </div>

          <div className="flex flex-col gap-3">
            {/* Target Mode Selector */}
            <div className="flex bg-secondary/50 p-1 rounded-xl gap-1 border border-border">
              <button
                type="button"
                onClick={() => setTargetMode('batch')}
                className={clsx(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                  targetMode === 'batch' ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                Dynamic Batch
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('fixed')}
                className={clsx(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                  targetMode === 'fixed' ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                Fixed List
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('shortcut')}
                className={clsx(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                  targetMode === 'shortcut' ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                Quick Shortcut
              </button>
            </div>

            <div className={styles.defaultValueGrid}>
              {/* Batch Card (if targetMode === 'batch') */}
              {targetMode === 'batch' && (
                <div className={styles.valueCard}>
                  <div className={styles.cardLabel}>
                    <Layers size={12} /> Default Batch
                  </div>
                  <select 
                    value={selectedBatch?.id || ''} 
                    onChange={e => {
                      const batch = batches.find(b => b.id === e.target.value);
                      setSelectedBatch(batch);
                    }}
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fixed List Search (if targetMode === 'fixed') */}
              {targetMode === 'fixed' && (
                <div className="col-span-full flex flex-col gap-2 p-3 bg-secondary/30 border border-border rounded-xl">
                  <span className="text-xs font-bold text-muted uppercase">Fixed Participants ({fixedParticipants.length})</span>
                  <StudentSearch 
                    placeholder="Search to add fixed student to preset..." 
                    onSelect={(st: any) => {
                      if (!fixedParticipants.find(p => p.student_id === st.id)) {
                        setFixedParticipants([...fixedParticipants, {
                          student_id: st.id,
                          name: st.name,
                          enrolment_no: st.enrolment_no,
                          amount: amount || '0'
                        }]);
                      }
                    }}
                    clearOnSelect
                  />
                  {fixedParticipants.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto mt-1">
                      {fixedParticipants.map((p, idx) => (
                        <div key={p.student_id || idx} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-border">
                          <span className="font-semibold text-foreground">{p.name}</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              placeholder="Amount"
                              value={p.amount}
                              onChange={e => {
                                const newAmount = e.target.value;
                                setFixedParticipants(fixedParticipants.map((item, i) => i === idx ? { ...item, amount: newAmount } : item));
                              }}
                              className="w-20 text-xs p-1 border border-border rounded text-right"
                            />
                            <button 
                              type="button" 
                              onClick={() => setFixedParticipants(fixedParticipants.filter((_, i) => i !== idx))}
                              className="text-danger hover:underline font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Amount Card */}
            <div className={styles.valueCard}>
              <div className={styles.cardLabel}>
                <IndianRupee size={12} /> Default Amount
              </div>
              <input 
                type="number" 
                placeholder="Enter Amount" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            {/* Purpose Card */}
            <div className={styles.valueCard}>
              <div className={styles.cardLabel}>
                <FileText size={12} /> Default Purpose
              </div>
              <input 
                placeholder="Enter Purpose" 
                value={purpose} 
                onChange={e => setPurpose(e.target.value)}
              />
            </div>

            {/* Type Card */}
            <div className={styles.valueCard}>
              <div className={styles.cardLabel}>
                <Type size={12} /> Transaction Type
              </div>
              <select 
                value={txType} 
                onChange={e => setTxType(e.target.value as any)}
              >
                <option value="deposit">Credit (+)</option>
                <option value="withdrawal">Debit (-)</option>
              </select>
            </div>

            {/* Notes Card */}
            <div className={clsx(styles.valueCard, "col-span-full")}>
              <div className={styles.cardLabel}>
                <FileText size={12} /> Internal Notes
              </div>
              <textarea 
                placeholder="Optional notes for internal record keeping" 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
            </div>
          </div>
        </div>
      </section>

        {/* Section 3: Live Preview */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <PlayCircle size={14} /> Live Preview
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Preset Identity</span>
                <div className={styles.previewTitle}>{name || 'Untitled Shortcut'}</div>
              </div>
              <div className={styles.previewBadge}>
                {category}
              </div>
            </div>

            <div className={styles.previewContent}>
              <div className={styles.previewItem}>
                <span className={styles.itemLabel}>Batch Context</span>
                <span className={styles.itemValue}>{selectedBatch?.name || 'Manual Selection'}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.itemLabel}>Default Amount</span>
                <span className={styles.itemValue}>{amount ? `₹${parseFloat(amount).toLocaleString()}` : 'Variable'}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.itemLabel}>Operation Type</span>
                <span className={styles.itemValue}>{txType === 'deposit' ? 'Credit Inflow' : 'Debit Outflow'}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.itemLabel}>Purpose</span>
                <span className={styles.itemValue}>{purpose || 'Not Defined'}</span>
              </div>
            </div>

            <div className={styles.previewFooter}>
              <div className={styles.defaultsCount}>
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                {defaultsCount} default values saved in this preset
              </div>
              <ChevronRight size={20} className="opacity-40" />
            </div>
          </div>
        </section>
      </div>
    </DrawerLayout>
  );
};
