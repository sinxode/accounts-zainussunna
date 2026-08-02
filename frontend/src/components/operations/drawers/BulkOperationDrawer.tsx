import React, { useState, useMemo } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { 
  UsersRound, 
  UserCheck, 
  FileSpreadsheet, 
  IndianRupee, 
  FileText, 
  ArrowDownCircle, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  ChevronRight, 
  Star, 
  LayoutTemplate,
  ChevronDown,
  Plus,
  Copy
} from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { transactionService, studentService, presetService, batchService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatSmartPurpose } from '../../../lib/utils';
import styles from './BulkV3.module.scss';
import { useOperationsDrawer } from './OperationsDrawerContext';

type Step = 'configure' | 'participants' | 'success';

interface TransactionItem {
  id: string;
  amount: string;
  purpose: string;
  date: string;
}

interface ParticipantGroup {
  student_id: string;
  name: string;
  enrolment_no: string;
  current_balance: number;
  transactions: TransactionItem[];
}

export const BulkOperationDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { drawerData } = useOperationsDrawer();
  const [step, setStep] = useState<Step>('configure');
  const [participantSource, setParticipantSource] = useState<'batch' | 'fixed' | 'csv' | null>(null);
  
  // Selections
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [participants, setParticipants] = useState<ParticipantGroup[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  
  // Common values
  const [commonAmount, setCommonAmount] = useState<string>('');
  const [commonPurpose, setCommonPurpose] = useState<string>('');
  const [commonType, setCommonType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [commonDate, setCommonDate] = useState<string>('');

  // Preset saving fields
  const [presetName, setPresetName] = useState<string>('');
  const [presetDescription, setPresetDescription] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetSaved, setPresetSaved] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load saved batches
  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: batchService.list
  });

  // Load saved presets
  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: presetService.list
  });

  // Restores preset if passed via context
  React.useEffect(() => {
    if (drawerData?.preset) {
      let config = drawerData.preset.configuration;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch {
          config = {};
        }
      }
      config = config || {};

      setCommonAmount(drawerData.preset.amount ? String(drawerData.preset.amount) : '');
      setCommonPurpose(drawerData.preset.purpose || '');
      setCommonType(drawerData.preset.transaction_type || 'deposit');
      setCommonDate(config?.date || '');

      if (config?.target_mode === 'batch') {
        setParticipantSource('batch');
        setSelectedBatchId(config.batch_id || '');
        if (config.batch_id) {
          const loadToast = toast.loading('Loading preset batch students...');
          studentService.listByBatch(config.batch_id).then(members => {
            setParticipants(members.map((s: any) => ({
              student_id: s.id,
              name: s.name,
              enrolment_no: s.enrolment_no,
              current_balance: Number(s.current_balance) || 0,
              transactions: [{
                id: crypto.randomUUID(),
                amount: '',
                purpose: '',
                date: ''
              }]
            })));
            setStep('participants');
            toast.dismiss(loadToast);
          }).catch(() => {
            toast.dismiss(loadToast);
            toast.error('Failed to load preset batch students');
          });
        }
      } else if (config?.target_mode === 'fixed' && config.participants) {
        setParticipantSource('fixed');
        setParticipants(config.participants.map((p: any) => ({
          student_id: p.student_id,
          name: p.name || 'Student',
          enrolment_no: p.enrolment_no || 'N/A',
          current_balance: Number(p.current_balance) || 0,
          transactions: [{
            id: crypto.randomUUID(),
            amount: p.amount ? String(p.amount) : '',
            purpose: '',
            date: ''
          }]
        })));
        setStep('participants');
      }
    }
  }, [drawerData]);

  // Expand the first participant accordion if none is expanded
  React.useEffect(() => {
    if (participants.length > 0 && !expandedStudentId) {
      setExpandedStudentId(participants[0].student_id);
    }
  }, [participants, expandedStudentId]);


  // Aggregate transaction counts and estimated totals
  const totalTransactionsCount = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.transactions.length, 0);
  }, [participants]);

  const totalAmount = useMemo(() => {
    return participants.reduce((sum, p) => {
      return sum + p.transactions.reduce((tSum, tx) => {
        const amt = parseFloat(commonAmount || tx.amount || '0') || 0;
        return tSum + amt;
      }, 0);
    }, 0);
  }, [participants, commonAmount]);

  const hasErrors = useMemo(() => {
    if (participants.length === 0) return true;
    for (const p of participants) {
      if (p.transactions.length === 0) return true;
      for (const tx of p.transactions) {
        if (!commonAmount && (!tx.amount || parseFloat(tx.amount) <= 0)) return true;
        if (!commonDate && !tx.date) return true;
      }
    }
    return false;
  }, [participants, commonAmount, commonDate]);

  const bulkMutation = useMutation({
    mutationFn: transactionService.createBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      toast.success('Transactions composed and processed successfully');
      setStep('success');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleProcess = () => {
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    if (participants.length === 0) {
      toast.error('Add at least one participant');
      return;
    }

    const operationId = crypto.randomUUID();
    const payload: any[] = [];

    participants.forEach(p => {
      p.transactions.forEach(tx => {
        payload.push({
          student_id: p.student_id,
          operation_id: operationId,
          transaction_type: commonType,
          direction: commonType === 'deposit' ? 'credit' : 'debit',
          amount: parseFloat(commonAmount || tx.amount || '0'),
          purpose: formatSmartPurpose(commonPurpose || tx.purpose || 'Transaction Composer Entry'),
          transaction_date: new Date(commonDate || tx.date || new Date().toISOString().split('T')[0]).toISOString(),
          created_by: user.id
        });
      });
    });

    bulkMutation.mutate(payload);
  };

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (step === 'participants' && !hasErrors) {
            handleProcess();
          }
        } else {
          if (step === 'configure' && participants.length > 0) {
            e.preventDefault();
            setStep('participants');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, participants, hasErrors, handleProcess]);

  const handleSaveAsPreset = async () => {
    if (!presetName) return toast.error('Preset name is required');
    setIsSavingPreset(true);
    try {
      await presetService.create({
        name: presetName,
        description: presetDescription || `Transaction Composer Preset for ${participants.length} students`,
        configuration: {
          target_mode: participantSource === 'batch' ? 'batch' : 'fixed',
          batch_id: participantSource === 'batch' ? selectedBatchId : undefined,
          participants: participantSource === 'fixed' ? participants.map(p => ({
            student_id: p.student_id,
            name: p.name,
            enrolment_no: p.enrolment_no,
            amount: commonAmount ? parseFloat(commonAmount) : 0,
            type: commonType
          })) : undefined,
          amount: commonAmount ? parseFloat(commonAmount) : undefined,
          type: commonType,
          purpose: commonPurpose || undefined
        },
        transaction_type: commonType,
        amount: commonAmount ? parseFloat(commonAmount) : null,
        purpose: commonPurpose || null
      });
      toast.success('Composer configuration saved as preset');
      setPresetSaved(true);
    } catch (err: any) {
      toast.error(`Failed to save preset: ${err.message}`);
    } finally {
      setIsSavingPreset(false);
    }
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
        const purposeIndex = headers.findIndex(h => h.includes('purpose') || h.includes('description'));
        const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('time'));

        if (enrolmentIndex === -1) {
          toast.error("CSV must contain a column for 'Enrolment No' or 'Student ID'");
          return;
        }

        const healthSummary = await studentService.getHealthSummary();
        const groupedCSV: Record<string, { student: any; rows: any[] }> = {};
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
            const parsedAmt = amountIndex !== -1 ? cols[amountIndex] : '';
            const parsedPurpose = purposeIndex !== -1 ? cols[purposeIndex] : '';
            const parsedDate = dateIndex !== -1 ? cols[dateIndex] : '';

            if (!groupedCSV[student.id]) {
              groupedCSV[student.id] = { student, rows: [] };
            }
            groupedCSV[student.id].rows.push({
              id: crypto.randomUUID(),
              amount: parsedAmt,
              purpose: parsedPurpose,
              date: parsedDate
            });
            successCount++;
          } else {
            failCount++;
          }
        }

        const importedGroups: ParticipantGroup[] = Object.values(groupedCSV).map(group => ({
          student_id: group.student.id,
          name: group.student.name,
          enrolment_no: group.student.enrolment_no,
          current_balance: Number(group.student.current_balance) || 0,
          transactions: group.rows
        }));

        if (importedGroups.length > 0) {
          setParticipants(importedGroups);
          setStep('participants');
          toast.success(`Imported ${successCount} entries. ${failCount > 0 ? `Skipped ${failCount} unmatched.` : ''}`);
        } else {
          toast.error("No matching student records found in CSV");
        }
      } catch (err: any) {
        toast.error(`CSV Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setParticipants([]);
    setCommonAmount('');
    setCommonPurpose('');
    setCommonType('deposit');
    setCommonDate('');
    setParticipantSource(null);
    setSelectedBatchId('');
    setPresetName('');
    setPresetDescription('');
    setPresetSaved(false);
    setStep('configure');
  };

  // Participant modifiers
  const addTransaction = (studentId: string) => {
    setParticipants(participants.map(p => {
      if (p.student_id === studentId) {
        return {
          ...p,
          transactions: [
            ...p.transactions,
            {
              id: crypto.randomUUID(),
              amount: '',
              purpose: '',
              date: ''
            }
          ]
        };
      }
      return p;
    }));
  };

  const deleteTransaction = (studentId: string, transactionId: string) => {
    setParticipants(participants.map(p => {
      if (p.student_id === studentId) {
        return {
          ...p,
          transactions: p.transactions.filter(t => t.id !== transactionId)
        };
      }
      return p;
    }));
  };

  const duplicateTransaction = (studentId: string, transactionId: string) => {
    setParticipants(participants.map(p => {
      if (p.student_id === studentId) {
        const target = p.transactions.find(t => t.id === transactionId);
        if (target) {
          const clone = { ...target, id: crypto.randomUUID() };
          return {
            ...p,
            transactions: [...p.transactions, clone]
          };
        }
      }
      return p;
    }));
  };

  const updateTransactionField = (studentId: string, transactionId: string, field: keyof TransactionItem, value: string) => {
    setParticipants(participants.map(p => {
      if (p.student_id === studentId) {
        return {
          ...p,
          transactions: p.transactions.map(t => t.id === transactionId ? { ...t, [field]: value } : t)
        };
      }
      return p;
    }));
  };

  const removeParticipant = (studentId: string) => {
    setParticipants(participants.filter(p => p.student_id !== studentId));
  };

  const renderFooter = () => {
    if (step === 'configure') {
      return (
        <Button
          variant="primary"
          disabled={participants.length === 0}
          onClick={() => setStep('participants')}
          icon={<ChevronRight size={16} />}
          iconPosition="right"
          fullWidth
        >
          Continue
        </Button>
      );
    }

    if (step === 'participants') {
      return (
        <div className={styles.stickyFooter} style={{ width: '100%' }}>
          <div className={styles.footerStats}>
            <div className={styles.statItem}>
              <span className={styles.label}>Participants</span>
              <span className={styles.value}>{participants.length} Student{participants.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.label}>Composed Count</span>
              <span className={styles.value}>{totalTransactionsCount} Entry{totalTransactionsCount !== 1 ? 'ies' : ''}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.label}>Total Amount</span>
              <span className={styles.value}>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.footerActions}>
            <Button
              variant="secondary"
              onClick={() => setStep('configure')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleProcess}
              loading={bulkMutation.isPending}
              disabled={hasErrors}
            >
              Process Composer
            </Button>
          </div>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <div className="flex w-full gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            View Transactions
          </Button>
          <Button
            variant="primary"
            onClick={handleClear}
            className="flex-1"
          >
            Create Another
          </Button>
        </div>
      );
    }

    return <></>;
  };

  return (
    <DrawerLayout
      title={step === 'success' ? "Composer Success" : "Transaction Composer"}
      subtitle={step === 'success' ? "All composed entries processed successfully" : "Compose multiple financial transactions intelligently."}
      icon={<UsersRound className="text-white" />}
      onClose={onClose}
      onClear={step === 'success' ? undefined : handleClear}
      size="xl"
      footer={renderFooter()}
    >
      <div className={styles.workspace}>
        {/* Step 1: Common Values Selection */}
        {step === 'configure' && (
          <>
            <div className={styles.stepHeader}>
              <h2 className={styles.title}>Common Values</h2>
              <p className={styles.subtitle}>Enter anything that should remain identical for every transaction.</p>
            </div>

            {/* Quick Preset Selector */}
            {presets && presets.length > 0 && (
              <div className={styles.valueCard}>
                <div className={styles.cardHeader}>
                  <LayoutTemplate size={14} /> Quick Load Preset
                </div>
                <select
                  value=""
                  onChange={async (e) => {
                    const pr = presets.find(p => p.id === e.target.value);
                    if (pr) {
                      let config = pr.configuration;
                      if (typeof config === 'string') {
                        try {
                          config = JSON.parse(config);
                        } catch {
                          config = {};
                        }
                      }
                      config = config || {};

                      setCommonAmount(pr.amount ? String(pr.amount) : '');
                      setCommonPurpose(pr.purpose || '');
                      setCommonType(pr.transaction_type || 'deposit');
                      setCommonDate(config?.date || '');

                      if (config?.target_mode === 'batch') {
                        setParticipantSource('batch');
                        setSelectedBatchId(config.batch_id || '');
                        if (config.batch_id) {
                          const loadToast = toast.loading('Loading preset batch students...');
                          try {
                            const members = await studentService.listByBatch(config.batch_id);
                            setParticipants(members.map((s: any) => ({
                              student_id: s.id,
                              name: s.name,
                              enrolment_no: s.enrolment_no,
                              current_balance: Number(s.current_balance) || 0,
                              transactions: [{
                                id: crypto.randomUUID(),
                                amount: '',
                                purpose: '',
                                date: ''
                              }]
                            })));
                            setStep('participants');
                            toast.dismiss(loadToast);
                          } catch {
                            toast.dismiss(loadToast);
                            toast.error('Failed to load batch students');
                          }
                        }
                      } else if (config?.target_mode === 'fixed' && config.participants) {
                        setParticipantSource('fixed');
                        setParticipants(config.participants.map((p: any) => ({
                          student_id: p.student_id,
                          name: p.name || 'Student',
                          enrolment_no: p.enrolment_no || 'N/A',
                          current_balance: Number(p.current_balance) || 0,
                          transactions: [{
                            id: crypto.randomUUID(),
                            amount: p.amount ? String(p.amount) : '',
                            purpose: '',
                            date: ''
                          }]
                        })));
                        setStep('participants');
                      }
                      toast.success(`Preset "${pr.name}" loaded`);
                    }
                  }}
                >
                  <option value="" disabled>Select Preset to Pre-fill Composer...</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.amount ?? 0})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Participants Source Cards */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Participants</span>
              <div className={styles.sourceGrid}>
                <div 
                  className={clsx(styles.sourceCard, participantSource === 'batch' && styles.active)}
                  onClick={() => {
                    setParticipantSource('batch');
                    setParticipants([]);
                  }}
                >
                  <div className={styles.iconContainer}>
                    <UsersRound size={20} />
                  </div>
                  <span className={styles.cardTitle}>Batch</span>
                  <span className={styles.cardDesc}>Load students from an existing batch.</span>
                </div>

                <div 
                  className={clsx(styles.sourceCard, participantSource === 'fixed' && styles.active)}
                  onClick={() => {
                    setParticipantSource('fixed');
                    setParticipants([]);
                  }}
                >
                  <div className={styles.iconContainer}>
                    <UserCheck size={20} />
                  </div>
                  <span className={styles.cardTitle}>Student List</span>
                  <span className={styles.cardDesc}>Manually choose students.</span>
                </div>

                <div 
                  className={clsx(styles.sourceCard, participantSource === 'csv' && styles.active)}
                  onClick={() => {
                    setParticipantSource('csv');
                    setParticipants([]);
                  }}
                >
                  <div className={styles.iconContainer}>
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className={styles.cardTitle}>CSV Import</span>
                  <span className={styles.cardDesc}>Import participants from CSV.</span>
                </div>
              </div>
            </div>

            {/* Render Active Source Input Box */}
            {participantSource === 'batch' && (
              <div className={styles.activeSourceBox}>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={async (e) => {
                    const batchId = e.target.value;
                    setSelectedBatchId(batchId);
                    if (batchId) {
                      try {
                        const members = await studentService.listByBatch(batchId);
                        setParticipants(members.map((s: any) => ({
                          student_id: s.id,
                          name: s.name,
                          enrolment_no: s.enrolment_no,
                          current_balance: Number(s.current_balance) || 0,
                          transactions: [{
                            id: crypto.randomUUID(),
                            amount: '',
                            purpose: '',
                            date: ''
                          }]
                        })));
                        toast.success(`Loaded ${members.length} students from batch`);
                      } catch (err: any) {
                        toast.error(`Failed to load batch students: ${err.message}`);
                      }
                    } else {
                      setParticipants([]);
                    }
                  }}
                >
                  <option value="">Select a batch...</option>
                  {batches?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {participantSource === 'fixed' && (
              <div className={styles.activeSourceBox}>
                <StudentSearch
                  label="Search & Link Student"
                  placeholder="Type student name to link..."
                  onSelect={(student) => {
                    if (participants.find(p => p.student_id === student.id)) {
                      toast.error('Student already added');
                      return;
                    }
                    const newP: ParticipantGroup = {
                      student_id: student.id,
                      name: student.name,
                      enrolment_no: student.enrolment_no,
                      current_balance: Number(student.current_balance) || 0,
                      transactions: [{
                        id: crypto.randomUUID(),
                        amount: '',
                        purpose: '',
                        date: ''
                      }]
                    };
                    setParticipants([...participants, newP]);
                  }}
                  clearOnSelect
                />
                
                {participants.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto mt-1">
                    {participants.map((p) => (
                      <div key={p.student_id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-semibold text-slate-700">{p.name} ({p.enrolment_no})</span>
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.student_id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {participantSource === 'csv' && (
              <div className={styles.activeSourceBox}>
                <label className="text-xs font-bold text-slate-500 uppercase">Upload CSV File</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('csv-file-input-v3')?.click()}
                    icon={<FileSpreadsheet size={16} />}
                  >
                    Select CSV File
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="csv-file-input-v3"
                    onChange={handleCSVImport}
                  />
                  {participants.length > 0 && (
                    <span className="text-xs font-bold text-green-600">{participants.length} Students imported</span>
                  )}
                </div>
              </div>
            )}

            {/* Common Values Grid */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Common Values</span>
              <div className={styles.valueCardsGrid}>
                {/* Amount */}
                <div className={styles.valueCard}>
                  <div className={styles.cardHeader}>
                    <IndianRupee size={13} /> Amount
                  </div>
                  <input 
                    type="number"
                    placeholder="e.g. 1000 (Empty for individual)"
                    value={commonAmount}
                    onChange={e => setCommonAmount(e.target.value)}
                  />
                </div>

                {/* Purpose */}
                <div className={styles.valueCard}>
                  <div className={styles.cardHeader}>
                    <FileText size={13} /> Purpose
                  </div>
                  <input 
                    type="text"
                    placeholder="e.g. Zakaath - {Month} {Year}"
                    value={commonPurpose}
                    onChange={e => setCommonPurpose(e.target.value)}
                  />
                </div>

                {/* Transaction Type */}
                <div className={styles.valueCard}>
                  <div className={styles.cardHeader}>
                    <ArrowDownCircle size={13} /> Transaction Type
                  </div>
                  <select
                    value={commonType}
                    onChange={e => setCommonType(e.target.value as any)}
                  >
                    <option value="deposit">Credit (+) Deposit</option>
                    <option value="withdrawal">Debit (-) Withdrawal</option>
                  </select>
                </div>

                {/* Date */}
                <div className={styles.valueCard}>
                  <div className={styles.cardHeader}>
                    <Calendar size={13} /> Date
                  </div>
                  <input 
                    type="date"
                    value={commonDate}
                    onChange={e => setCommonDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className={styles.previewPanel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Setup Summary</span>
                <div className={styles.badgesRow}>
                  <span className={clsx(styles.badge, styles.blue)}>
                    {participants.length} Student{participants.length !== 1 ? 's' : ''} Selected
                  </span>
                  <span className={clsx(styles.badge, styles.gray)}>
                    {[commonAmount, commonPurpose, commonType, commonDate].filter(Boolean).length} Common
                  </span>
                  <span className={clsx(styles.badge, styles.gray)}>
                    {[commonAmount, commonPurpose, commonDate].filter(x => !x).length} Individual
                  </span>
                </div>
              </div>

              <div className={styles.previewDetails}>
                <div className={styles.detailRow}>
                  <span>Selected Source</span>
                  <span>
                    {participantSource === 'batch' ? 'Batch Group' :
                     participantSource === 'fixed' ? 'Fixed List' :
                     participantSource === 'csv' ? 'CSV Import' : 'None'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span>Common Values</span>
                  <span>
                    {[
                      commonAmount && 'Amount',
                      commonPurpose && 'Purpose',
                      commonType && 'Type',
                      commonDate && 'Date'
                    ].filter(Boolean).join(', ') || 'None'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span>Individual Fields (Step 2)</span>
                  <span>
                    {[
                      !commonAmount && 'Amount',
                      !commonPurpose && 'Purpose',
                      !commonDate && 'Date'
                    ].filter(Boolean).join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>

          </>
        )}

        {/* Step 2: Compose Transactions Accordion Workspace */}
        {step === 'participants' && (
          <>
            <div className={styles.stepHeader}>
              <h2 className={styles.title}>Compose Transactions</h2>
              <p className={styles.subtitle}>Only complete the values that are still missing.</p>
            </div>

            <div className={styles.composerArea}>
              {participants.map((p) => {
                const isExpanded = expandedStudentId === p.student_id;
                const estimatedPTotal = p.transactions.reduce((acc, tx) => {
                  return acc + (parseFloat(commonAmount || tx.amount || '0') || 0);
                }, 0);

                return (
                  <div key={p.student_id} className={clsx(styles.participantCard, isExpanded && styles.expanded)}>
                    {/* Header */}
                    <div 
                      className={styles.participantHeader}
                      onClick={() => setExpandedStudentId(isExpanded ? null : p.student_id)}
                    >
                      <div className={styles.leftSection}>
                        <div className={styles.avatarCircle}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.pInfoBlock}>
                          <span className={styles.pName}>{p.name}</span>
                          <div className={styles.pMeta}>
                            <span>{p.enrolment_no}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Balance: 
                              <strong className={clsx("ml-1", p.current_balance < 0 ? styles.negative : styles.positive)}>
                                ₹{p.current_balance.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.rightSection}>
                        <span className={styles.txCountBadge}>
                          {p.transactions.length} Tx{p.transactions.length !== 1 ? 's' : ''}
                        </span>
                        
                        <div className={styles.estimatedTotal}>
                          <span className="estLabel">Total</span>
                          <span className="estValue">₹{estimatedPTotal.toLocaleString()}</span>
                        </div>

                        <div className={styles.headerActions} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className={clsx(styles.chevronBtn, isExpanded && styles.rotated)}
                            onClick={() => setExpandedStudentId(isExpanded ? null : p.student_id)}
                          >
                            <ChevronDown size={18} />
                          </button>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeParticipant(p.student_id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible workspace */}
                    {isExpanded && (
                      <div className={styles.expandedWorkspace}>
                        {p.transactions.map((tx, txIdx) => (
                          <div key={tx.id} className={styles.transactionCard}>
                            <div className={styles.cardTitleLine}>
                              <span className={styles.txTitle}>Transaction Card #{txIdx + 1}</span>
                              <div className={styles.cardActions}>
                                <button
                                  type="button"
                                  title="Duplicate Transaction Card"
                                  onClick={() => duplicateTransaction(p.student_id, tx.id)}
                                >
                                  <Copy size={13} />
                                </button>
                                {p.transactions.length > 1 && (
                                  <button
                                    type="button"
                                    className={styles.deleteBtn}
                                    title="Delete Transaction Card"
                                    onClick={() => deleteTransaction(p.student_id, tx.id)}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className={styles.transactionCardGrid}>
                              {/* Amount input cell */}
                              {!commonAmount && (
                                <div className={styles.inputWrapper}>
                                  <label>Amount (₹)</label>
                                  <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={tx.amount}
                                    onChange={e => updateTransactionField(p.student_id, tx.id, 'amount', e.target.value)}
                                  />
                                </div>
                              )}

                              {/* Purpose input cell */}
                              {!commonPurpose && (
                                <div className={styles.inputWrapper}>
                                  <label>Purpose</label>
                                  <input 
                                    type="text"
                                    placeholder="e.g. Mess charge..."
                                    value={tx.purpose}
                                    onChange={e => updateTransactionField(p.student_id, tx.id, 'purpose', e.target.value)}
                                  />
                                </div>
                              )}

                              {/* Date input cell */}
                              {!commonDate && (
                                <div className={styles.inputWrapper}>
                                  <label>Date</label>
                                  <input 
                                    type="date"
                                    value={tx.date}
                                    onChange={e => updateTransactionField(p.student_id, tx.id, 'date', e.target.value)}
                                  />
                                </div>
                              )}

                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className={styles.addTransactionBtn}
                          onClick={() => addTransaction(p.student_id)}
                        >
                          <Plus size={12} /> Add Transaction
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Success Screen */}
        {step === 'success' && (
          <div className={styles.successScreen}>
            <div className={styles.checkIcon}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.successTitle}>Composer Success</h2>
            <p className={styles.successDesc}>
              All composed transactions have been successfully recorded in the student ledgers.
            </p>

            <div className={styles.summaryBox}>
              <div className={styles.summaryTitle}>Composed Operation Summary</div>
              <div className={styles.summaryRow}>
                <span>Students Composed</span>
                <span>{participants.length} Students</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Total Composed Entries</span>
                <span>{totalTransactionsCount} Transactions</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Total Capital Composed</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>



            {!presetSaved ? (
              <div className={styles.savePresetBox}>
                <span className={styles.presetTitle}>Save Composer Preset</span>
                <Input 
                  label="Preset Name"
                  placeholder="e.g. Composed Mess & Books"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                />
                <Input 
                  label="Description"
                  placeholder="e.g. Shortcut configuration presets"
                  value={presetDescription}
                  onChange={e => setPresetDescription(e.target.value)}
                />
                <Button
                  variant="soft"
                  onClick={handleSaveAsPreset}
                  loading={isSavingPreset}
                  icon={<Star size={15} />}
                >
                  Save Preset
                </Button>
              </div>
            ) : (
              <div className="mt-6 text-xs font-bold text-green-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Operation configuration saved as preset!
              </div>
            )}
          </div>
        )}
      </div>
    </DrawerLayout>
  );
};
