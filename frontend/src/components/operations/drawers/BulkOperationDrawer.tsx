import React, { useState, useMemo } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { 
  Copy, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  PlayCircle, 
  Save, 
  UsersRound, 
  LayoutTemplate,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Star
} from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { transactionService, studentService, presetService, batchService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatSmartPurpose } from '../../../lib/utils';
import styles from './DrawerStyles.module.scss';
import { useOperationsDrawer } from './OperationsDrawerContext';

type Step = 'configure' | 'participants' | 'review' | 'success';

interface Participant {
  id: string;
  student_id: string;
  name: string;
  enrolment_no: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  purpose: string;
  notes: string;
}

export const BulkOperationDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { drawerData } = useOperationsDrawer();
  const [step, setStep] = useState<Step>(drawerData?.preset ? 'participants' : 'configure');
  const [operationName, setOperationName] = useState(drawerData?.preset?.name || '');
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalPurpose, setGlobalPurpose] = useState(
    formatSmartPurpose(drawerData?.preset?.configuration?.purpose || drawerData?.preset?.purpose || '')
  );
  const [globalAmount, setGlobalAmount] = useState<string>(
    drawerData?.preset?.configuration?.amount ?? drawerData?.preset?.amount ? String(drawerData?.preset?.configuration?.amount ?? drawerData?.preset?.amount) : ''
  );
  const [globalType, setGlobalType] = useState<'deposit' | 'withdrawal'>(
    drawerData?.preset?.configuration?.type || drawerData?.preset?.transaction_type || 'deposit'
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [showBatchSelect, setShowBatchSelect] = useState(false);
  const [showPresetSelect, setShowPresetSelect] = useState(false);
  const [activeLoadedPreset, setActiveLoadedPreset] = useState<any>(drawerData?.preset || null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load saved batches for selection
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: batchService.list,
    enabled: showBatchSelect
  });

  // Load saved presets for selection
  const { data: presets, isLoading: isPresetsLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: presetService.list,
    enabled: showPresetSelect
  });

  // Load preset or batch data if provided
  React.useEffect(() => {
    const loadPresetOrBatch = async () => {
      // 1. Direct batchId load action (from Load Batch button click)
      if (drawerData?.batchId) {
        try {
          const batchMembers = await studentService.listByBatch(drawerData.batchId);
          const batchParticipants = batchMembers
            .filter((student: any) => student && student.id)
            .map((student: any) => ({
              id: crypto.randomUUID(),
              student_id: student.id,
              name: student.name,
              enrolment_no: student.enrolment_no,
              amount: 0,
              type: 'deposit' as 'deposit' | 'withdrawal',
              purpose: globalPurpose || '',
              notes: ''
            }));
          setParticipants(batchParticipants);
          
          // Look up batch name for pre-filling Operation Name
          const allBatches = await batchService.list();
          const currentBatch = allBatches.find(b => b.id === drawerData.batchId);
          if (currentBatch) {
            setOperationName(currentBatch.name);
          }
          
          setStep('participants');
          toast.success(`Batch loaded successfully`);
        } catch (err: any) {
          toast.error(`Failed to load batch: ${err.message}`);
        }
        return;
      }

      // 2. Load preset data
      if (drawerData?.preset) {
        const config = drawerData.preset.configuration;
        
        // If preset has explicit participants
        if (config.participants && Array.isArray(config.participants)) {
          const restoredParticipants = config.participants.map((p: any) => ({
            id: crypto.randomUUID(),
            student_id: p.student_id,
            name: p.name || 'Restored Student',
            enrolment_no: p.enrolment_no || 'N/A',
            amount: p.amount || config.amount || 0,
            type: (p.type || config.type || 'deposit') as 'deposit' | 'withdrawal',
            purpose: config.purpose || '',
            notes: ''
          }));
          setParticipants(restoredParticipants);
        } 
        // If preset has a batch_id, fetch students from that batch
        else if (config.batch_id) {
          try {
            const batchMembers = await studentService.listByBatch(config.batch_id);
            const batchParticipants = batchMembers
              .filter((student: any) => student && student.id)
              .map((student: any) => ({
                id: crypto.randomUUID(),
                student_id: student.id,
                name: student.name,
                enrolment_no: student.enrolment_no,
                amount: config.amount || 0,
                type: (config.type || 'deposit') as 'deposit' | 'withdrawal',
                purpose: config.purpose || '',
                notes: ''
              }));
            setParticipants(batchParticipants);
          } catch (err) {
            toast.error('Failed to load batch students');
          }
        }
        
        toast.success(`Preset "${drawerData.preset.name}" loaded`);
      }
    };

    loadPresetOrBatch();
  }, [drawerData]);

  const totalAmount = useMemo(() => {
    return participants.reduce((sum, p) => {
      return sum + (p.type === 'deposit' ? p.amount : -p.amount);
    }, 0);
  }, [participants]);

  const bulkMutation = useMutation({
    mutationFn: transactionService.createBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      toast.success('Bulk operation processed successfully');
      setStep('success');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleApplyPreset = async (preset: any) => {
    setActiveLoadedPreset(preset);
    if (!operationName) setOperationName(preset.name);
    const config = preset.configuration;
    const formattedPurp = formatSmartPurpose(config?.purpose || preset.purpose || '');
    if (formattedPurp) setGlobalPurpose(formattedPurp);

    const prAmt = config?.amount ?? preset.amount;
    if (prAmt) setGlobalAmount(String(prAmt));
    const prType = config?.type || preset.transaction_type || 'deposit';
    setGlobalType(prType);

    const numericAmount = prAmt ? parseFloat(String(prAmt)) : 0;

    if (config?.participants && Array.isArray(config.participants)) {
      const restored = config.participants.map((p: any) => ({
        id: crypto.randomUUID(),
        student_id: p.student_id,
        name: p.name || 'Student',
        enrolment_no: p.enrolment_no || 'N/A',
        amount: p.amount || numericAmount || 0,
        type: (p.type || prType) as 'deposit' | 'withdrawal',
        purpose: formattedPurp || '',
        notes: ''
      }));
      setParticipants(restored);
    } else if (config?.batch_id) {
      try {
        const batchMembers = await studentService.listByBatch(config.batch_id);
        const batchParticipants = batchMembers
          .filter((student: any) => student && student.id)
          .map((student: any) => ({
            id: crypto.randomUUID(),
            student_id: student.id,
            name: student.name,
            enrolment_no: student.enrolment_no,
            amount: numericAmount || 0,
            type: prType as 'deposit' | 'withdrawal',
            purpose: formattedPurp || '',
            notes: ''
          }));
        setParticipants(batchParticipants);
      } catch {
        toast.error('Failed to load preset batch members');
      }
    }
    setShowPresetSelect(false);
    setStep('participants');
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const handleSyncGlobalAmountToAll = (newAmountStr: string) => {
    setGlobalAmount(newAmountStr);
    const numericAmount = parseFloat(newAmountStr);
    if (!isNaN(numericAmount) && participants.length > 0) {
      setParticipants(participants.map(p => ({ ...p, amount: numericAmount })));
    }
  };

  const handleSyncGlobalTypeToAll = (newType: 'deposit' | 'withdrawal') => {
    setGlobalType(newType);
    if (participants.length > 0) {
      setParticipants(participants.map(p => ({ ...p, type: newType })));
    }
  };

  const handleAddParticipant = (student: any) => {
    if (participants.find(p => p.student_id === student.id)) {
      toast.error('Student already added');
      return;
    }

    const numericGlobalAmount = parseFloat(globalAmount) || 0;

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      student_id: student.id,
      name: student.name,
      enrolment_no: student.enrolment_no,
      amount: numericGlobalAmount,
      type: globalType,
      purpose: globalPurpose || '',
      notes: ''
    };

    setParticipants([newParticipant, ...participants]);
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleSaveAsPreset = async () => {
    if (!operationName) return toast.error('Preset name is required');
    setIsSavingPreset(true);
    try {
      await presetService.create({
        name: operationName,
        description: globalPurpose || `Bulk operation for ${participants.length} students`,
        configuration: {
          participants: participants.map(p => ({
            student_id: p.student_id,
            name: p.name,
            enrolment_no: p.enrolment_no,
            amount: p.amount,
            type: p.type
          })),
          amount: participants[0]?.amount || 0,
          type: participants[0]?.type || 'deposit',
          purpose: globalPurpose
        },
        transaction_type: participants[0]?.type || 'deposit',
        amount: participants[0]?.amount || 0,
        purpose: globalPurpose || null
      });
      toast.success('Configuration saved as preset');
    } catch (err: any) {
      toast.error(`Failed to save preset: ${err.message}`);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleProcess = () => {
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    if (!operationName) return toast.error('Operation name is required');
    if (participants.length === 0) return toast.error('Add at least one participant');
    if (participants.some(p => p.amount <= 0)) return toast.error('All amounts must be greater than 0');

    const operationId = crypto.randomUUID();
    const payload = participants.map(p => ({
      student_id: p.student_id,
      operation_id: operationId,
      transaction_type: p.type === 'deposit' ? 'deposit' : 'withdrawal',
      direction: p.type === 'deposit' ? 'credit' : 'debit',
      amount: p.amount,
      purpose: p.purpose || operationName,
      transaction_date: new Date(operationDate).toISOString(),
      created_by: user.id
    }));

    bulkMutation.mutate(payload);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          toast.error("CSV must contain a header and at least one data row");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const enrolmentIndex = headers.findIndex(h => 
          h === 'enrolment_no' || 
          h === 'enrolment' || 
          h === 'enrolment no' || 
          h === 'enrolmentno' || 
          h === 'student_id' || 
          h === 'student id' || 
          h === 'studentid' || 
          h === 'id' || 
          h === 'roll_no' || 
          h === 'roll no' || 
          h === 'rollno' || 
          h === 'no' ||
          h.includes('enrol') ||
          (h.includes('no') && !h.includes('note') && !h.includes('amount') && !h.includes('purpose'))
        );
        const amountIndex = headers.findIndex(h => 
          h === 'amount' || 
          h === 'value' || 
          h === 'fee' || 
          h === 'balance' || 
          h.includes('amount') || 
          h.includes('fee') ||
          h.includes('rs') ||
          h.includes('rupee')
        );
        const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('direction'));
        const purposeIndex = headers.findIndex(h => h.includes('purpose') || h.includes('description'));

        if (enrolmentIndex === -1) {
          toast.error("CSV must contain a column for 'Enrolment No' or 'Student ID'");
          return;
        }

        const healthSummary = await studentService.getHealthSummary();
        const importedParticipants: Participant[] = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const enrolmentNo = cols[enrolmentIndex]?.trim();
          if (!enrolmentNo) continue;

          const student = healthSummary.find(
            s => (s.enrolment_no && s.enrolment_no.toLowerCase() === enrolmentNo.toLowerCase()) || 
                 (s.name && s.name.toLowerCase() === enrolmentNo.toLowerCase())
          );
          
          if (student) {
            const amount = amountIndex !== -1 ? parseFloat(cols[amountIndex]) || 0 : 0;
            const type = (typeIndex !== -1 && cols[typeIndex]?.toLowerCase().includes('withdraw') ? 'withdrawal' : 'deposit') as 'deposit' | 'withdrawal';
            const purpose = purposeIndex !== -1 && cols[purposeIndex] ? cols[purposeIndex] : globalPurpose;

            importedParticipants.push({
              id: crypto.randomUUID(),
              student_id: student.id,
              name: student.name,
              enrolment_no: student.enrolment_no,
              amount: amount,
              type: type,
              purpose: purpose || '',
              notes: ''
            });
            successCount++;
          } else {
            failCount++;
          }
        }

        if (importedParticipants.length > 0) {
          setParticipants(importedParticipants);
          setStep('participants');
          toast.success(`Imported ${successCount} students successfully. ${failCount > 0 ? `Could not match ${failCount} records.` : ''}`);
        } else {
          toast.error("Could not match student enrolment numbers in CSV to system records");
        }
      } catch (err: any) {
        toast.error(`CSV Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  const renderStepIndicator = () => {
    if (step === 'success') return null;
    const steps = [
      { id: 'configure', label: 'Configure' },
      { id: 'participants', label: 'Participants' },
      { id: 'review', label: 'Review & Run' }
    ];
    const currentIndex = steps.findIndex(s => s.id === step);
    
    return (
      <div className={styles.stepIndicator}>
        <div className={styles.header}>
          <span className={styles.progressLabel}>Step {currentIndex + 1} of 3</span>
          <span className={styles.stepLabel}>{steps[currentIndex].label}</span>
        </div>
        <div className={styles.barContainer}>
          {steps.map((s, i) => (
            <div 
              key={s.id} 
              className={clsx(
                styles.barSegment,
                i <= currentIndex && styles.active
              )} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <DrawerLayout
      title={step === 'success' ? "Operation Complete" : "Bulk Workspace"}
      subtitle={step === 'success' ? "All ledger entries recorded" : "Multi-student ledger processing"}
      icon={step === 'success' ? <CheckCircle2 className="text-success" /> : <Copy className="text-white" />}
      onClose={onClose}
      onClear={step === 'success' ? undefined : () => setParticipants([])}
      footer={
        step === 'success' ? (
          <Button 
            variant="primary" 
            onClick={() => {
              setStep('configure');
              setParticipants([]);
              setOperationName('');
            }}
            icon={<Plus size={18} />}
            fullWidth
          >
            New Bulk Operation
          </Button>
        ) : step !== 'review' ? (
          <div className="flex w-full gap-2">
            {step !== 'configure' && (
              <Button
                variant="secondary"
                onClick={() => setStep('configure')}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={() => setStep(step === 'configure' ? 'participants' : 'review')}
              disabled={step === 'participants' && participants.length === 0}
              icon={<ChevronRight size={18} />}
              iconPosition="right"
              className="flex-1"
            >
              Next Step
            </Button>
          </div>
        ) : (
          <div className="flex w-full gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep('participants')}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleProcess} 
              loading={bulkMutation.isPending}
              icon={<PlayCircle size={18} />}
              className="flex-1"
            >
              Process Bulk
            </Button>
          </div>
        )
      }
    >
      <div className={styles.drawerContent}>
        {renderStepIndicator()}

        {step !== 'success' && step !== 'review' && (
          <div className={styles.summaryStrip}>
            <div className={styles.statsGroup}>
              <div className={styles.stat}>
                <span className={styles.label}>Active Students</span>
                <span className={styles.value}>{participants.length}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.stat}>
                <span className={styles.label}>Net Impact</span>
                <span className={clsx(
                  styles.value, 
                  totalAmount >= 0 ? styles.positive : styles.negative
                )}>
                  ₹{Math.abs(totalAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="flex flex-col gap-3">
            <div className={styles.configSection}>
              <h3 className={styles.sectionTitle}><Save size={13} className="text-primary" /> Global Operation Parameters</h3>
              <div className="flex flex-col gap-2 mt-1">
                <Input label="Operation Name" placeholder="e.g. Monthly Mess Fee - June 2026" value={operationName} onChange={e => setOperationName(e.target.value)} />
                <div className={styles.formGrid2}>
                  <Input 
                    label="Global Default Amount (₹)" 
                    type="number"
                    placeholder="e.g. 1200 (Applied to all students)"
                    value={globalAmount}
                    onChange={e => handleSyncGlobalAmountToAll(e.target.value)}
                  />
                  <Select
                    label="Transaction Type"
                    value={globalType}
                    onChange={e => handleSyncGlobalTypeToAll(e.target.value as any)}
                  >
                    <option value="deposit">Credit (+) Deposit</option>
                    <option value="withdrawal">Debit (-) Withdrawal</option>
                  </Select>
                </div>
                <div className={styles.formGrid2}>
                  <Input label="Effective Date" type="date" value={operationDate} onChange={e => setOperationDate(e.target.value)} />
                  <Input label="Default Purpose" placeholder="e.g. June Mess Fee (Use {Month} for auto-date)" value={globalPurpose} onChange={e => setGlobalPurpose(e.target.value)} />
                </div>
              </div>
            </div>

            {showBatchSelect ? (
              <div className={styles.configSection}>
                <div className="flex justify-between items-center mb-1">
                  <span className={styles.sectionTitle}><UsersRound size={13} className="text-primary" /> Select Saved Batch</span>
                  <button type="button" onClick={() => setShowBatchSelect(false)} className="text-xs text-primary font-semibold hover:underline">Cancel</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                  {isBatchesLoading ? (
                    <div className="text-xs text-muted py-4 text-center">Loading batches...</div>
                  ) : batches && batches.length > 0 ? (
                    batches.map((b: any) => (
                      <button
                        key={b.id}
                        type="button"
                        className={styles.batchSelectItem}
                        onClick={async () => {
                          try {
                            const batchMembers = await studentService.listByBatch(b.id);
                            const numericAmt = parseFloat(globalAmount) || 0;
                            const batchParticipants = batchMembers
                              .filter((student: any) => student && student.id)
                              .map((student: any) => ({
                                id: crypto.randomUUID(),
                                student_id: student.id,
                                name: student.name,
                                enrolment_no: student.enrolment_no,
                                amount: numericAmt,
                                type: globalType,
                                purpose: globalPurpose || '',
                                notes: ''
                              }));
                            setParticipants(batchParticipants);
                            if (!operationName) {
                              setOperationName(b.name);
                            }
                            toast.success(`Loaded ${batchParticipants.length} students from batch "${b.name}"`);
                            setShowBatchSelect(false);
                            setStep('participants');
                          } catch (err: any) {
                            toast.error(`Failed to load batch students: ${err.message}`);
                          }
                        }}
                      >
                        <span className="font-bold text-xs">{b.name}</span>
                        <span className="text-[10px] text-muted">{b.description || 'No description'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-muted py-4 text-center">No batches found. Go to Batch Management to create one.</div>
                  )}
                </div>
              </div>
            ) : showPresetSelect ? (
              <div className={styles.configSection}>
                <div className="flex justify-between items-center mb-1">
                  <span className={styles.sectionTitle}><LayoutTemplate size={13} className="text-primary" /> Select Entry Preset</span>
                  <button type="button" onClick={() => setShowPresetSelect(false)} className="text-xs text-primary font-semibold hover:underline">Cancel</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                  {isPresetsLoading ? (
                    <div className="text-xs text-muted py-4 text-center">Loading presets...</div>
                  ) : presets && presets.length > 0 ? (
                    presets.map((pr: any) => (
                      <button
                        key={pr.id}
                        type="button"
                        className={styles.batchSelectItem}
                        onClick={() => handleApplyPreset(pr)}
                      >
                        <span className="font-bold text-xs">{pr.name}</span>
                        <span className="text-[10px] text-muted">{pr.description || 'Preset configuration'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-muted py-4 text-center">No presets found. Create your first preset to get started.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className={styles.actionBlockBtn} onClick={() => { setShowPresetSelect(false); setShowBatchSelect(true); }}>
                  <UsersRound size={16} className={styles.actionIcon} />
                  <span className={styles.actionLabel}>Load Batch</span>
                </button>
                <button type="button" className={styles.actionBlockBtn} onClick={() => { setShowBatchSelect(false); setShowPresetSelect(true); }}>
                  <LayoutTemplate size={16} className={styles.actionIcon} />
                  <span className={styles.actionLabel}>Load Preset</span>
                </button>
                <button type="button" className={styles.actionBlockBtn} onClick={() => document.getElementById('csv-file-input')?.click()}>
                  <FileSpreadsheet size={16} className={styles.actionIcon} />
                  <span className={styles.actionLabel}>Import CSV</span>
                </button>
                <input 
                  type="file" 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  id="csv-file-input" 
                  onChange={handleCSVImport}
                />
              </div>
            )}
          </div>
        )}

        {step === 'participants' && (
          <div className="flex flex-col gap-3">
            {/* Global Operation Parameters Summary Bar */}
            <div className={styles.globalParamsBar}>
              <div className={styles.paramsTitle}>
                <span className="text-muted font-normal shrink-0">{activeLoadedPreset ? `Preset (${activeLoadedPreset.name}):` : 'Global Default:'}</span>
                <span className="font-extrabold text-foreground text-sm shrink-0">₹{globalAmount || '0'}</span>
                <span className={clsx(styles.paramBadge, globalType === 'withdrawal' ? styles.debit : styles.credit)}>
                  {globalType === 'withdrawal' ? 'Debit (-)' : 'Credit (+)'}
                </span>
                {globalPurpose && (
                  <span className="text-muted truncate max-w-[130px] font-normal hidden sm:inline">{globalPurpose}</span>
                )}
              </div>
              <div className={styles.paramInputs}>
                <input
                  type="number"
                  placeholder="Sync ₹"
                  value={globalAmount}
                  onChange={e => handleSyncGlobalAmountToAll(e.target.value)}
                />
                <select
                  value={globalType}
                  onChange={e => handleSyncGlobalTypeToAll(e.target.value as any)}
                >
                  <option value="deposit">Credit (+)</option>
                  <option value="withdrawal">Debit (-)</option>
                </select>
              </div>
            </div>

            <StudentSearch 
              label="Participant Lookup" 
              placeholder="Search and link students..." 
              onSelect={handleAddParticipant}
              clearOnSelect={true}
            />
            
            <div className={styles.selectionArea}>
              <div className={styles.listHeader}>
                <span>Participating Students ({participants.length})</span>
                {participants.length > 0 && <span onClick={() => setParticipants([])} className="text-danger cursor-pointer hover:underline">Remove All</span>}
              </div>
              
              <div className={styles.participantList}>
                {participants.map(p => (
                  <div key={p.id} className={styles.participantItem}>
                    <div className={styles.pInfo}>
                      <div className={styles.pAvatar}>
                        {(() => {
                          const parts = p.name.trim().split(/\s+/);
                          return parts.length > 1 
                            ? (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
                            : parts[0].charAt(0).toUpperCase();
                        })()}
                      </div>
                      <div className={styles.pDetails}>
                        <div className={styles.pName}>
                          {p.name}
                          {p.name.trim().split(/\s+/)[1] && (
                            <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-normal">
                              {p.name.trim().split(/\s+/)[1]}
                            </span>
                          )}
                        </div>
                        <div className={styles.pEnr}>{p.enrolment_no}</div>
                      </div>
                    </div>
                    
                    <div className={styles.pControls}>
                      <select 
                        value={p.type} 
                        onChange={e => updateParticipant(p.id, { type: e.target.value as any })}
                        className={styles.pSelect}
                      >
                        <option value="deposit">Deposit</option>
                        <option value="withdrawal">Withdrawal</option>
                      </select>
                      
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={p.amount || ''} 
                        onChange={e => updateParticipant(p.id, { amount: parseFloat(e.target.value) || 0 })}
                        className={styles.pInput}
                      />
                      
                      <button 
                        onClick={() => removeParticipant(p.id)} 
                        className={styles.removeBtn}
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <UsersRound size={24} />
                    </div>
                    <div>
                      <div className={styles.emptyTitle}>No students added</div>
                      <p className={styles.emptyDesc}>Add students above to begin bulk processing.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col gap-3">
            <div className={styles.reviewGradientCard}>
              <span className={styles.badge}>Ready to Process</span>
              <h2 className={styles.title}>{operationName || 'Unnamed Operation'}</h2>
              <div className={styles.meta}>
                <span><UsersRound size={13} /> {participants.length} Students</span>
                <span><Copy size={13} /> ₹{Math.abs(totalAmount).toLocaleString()} Net Flow</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">Final Validation</h4>
              <div className={styles.validationList}>
                {participants.some(p => p.amount === 0) && (
                  <div className={clsx(styles.validationItem, styles.danger)}>
                    <AlertCircle size={16} className="shrink-0" />
                    <span className="text-xs font-medium">Some students have zero amount set.</span>
                  </div>
                )}
                <div className={clsx(styles.validationItem, styles.success)}>
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span className="text-xs font-medium">All students linked to valid ledger accounts.</span>
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <Info size={14} className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">This operation will create {participants.length} individual ledger transactions. Action cannot be undone as a single batch.</p>
            </div>

            <div className="pt-3 border-t border-border">
              <Button 
                variant="soft" 
                fullWidth 
                onClick={handleSaveAsPreset}
                loading={isSavingPreset}
                icon={<Star size={15} />}
                className="min-height-[40px] text-xs"
              >
                Save Configuration as Preset
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successState}>
            <div className={styles.iconCircle}>
              <CheckCircle2 size={32} />
            </div>
            <h2 className={styles.title}>Bulk Process Successful</h2>
            <p className={styles.desc}>
              {participants.length} transactions have been recorded in the ledger and students' balances have been updated.
            </p>

            <div className={styles.configSection}>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <LayoutTemplate size={13} className="text-primary" /> Operations Shortcut
              </div>
              <p className="text-xs text-muted text-left">
                Do you perform this operation frequently? Save it as a preset to run it in seconds next time.
              </p>
              <Button 
                variant="soft" 
                fullWidth 
                onClick={handleSaveAsPreset}
                loading={isSavingPreset}
                icon={<Star size={15} />}
                className="min-height-[40px] text-xs"
              >
                Save As Preset
              </Button>
            </div>
          </div>
        )}
      </div>
    </DrawerLayout>
  );
};
