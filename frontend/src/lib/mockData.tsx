import { 
  ArrowDownLeft, 
  ShoppingBag, 
  Package, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const mockStudents = [
  { id: '1', name: 'Ahmed Khan', enrollment: 'ZLS-001', balance: 5400, status: 'active', health: 'healthy', lastActivity: '2026-06-12 10:30' },
  { id: '2', name: 'Rahman Aziz', enrollment: 'ZLS-002', balance: 52, status: 'active', health: 'low', lastActivity: '2026-06-13 14:15' },
  { id: '3', name: 'Sameer Uddin', enrollment: 'ZLS-003', balance: 92, status: 'active', health: 'low', lastActivity: '2026-06-11 09:45' },
  { id: '4', name: 'Ali Mohammed', enrollment: 'ZLS-004', balance: 0, status: 'active', health: 'empty', lastActivity: '2026-06-10 16:20' },
  { id: '5', name: 'Niyas P.K.', enrollment: 'ZLS-005', balance: 0, status: 'active', health: 'empty', lastActivity: '2026-06-12 11:05' },
  { id: '6', name: 'Shafi Rahman', enrollment: 'ZLS-006', balance: -150, status: 'active', health: 'negative', lastActivity: '2026-06-14 08:30' },
  { id: '7', name: 'Basheer Ali', enrollment: 'ZLS-007', balance: 12500, status: 'active', health: 'healthy', lastActivity: '2026-06-14 12:00' },
  { id: '8', name: 'Ibrahim Khalil', enrollment: 'ZLS-008', balance: 3200, status: 'active', health: 'healthy', lastActivity: '2026-06-11 15:45' },
  { id: '9', name: 'Mustafa S.', enrollment: 'ZLS-009', balance: 450, status: 'active', health: 'healthy', lastActivity: '2026-06-13 17:10' },
  { id: '10', name: 'Yusuf Raza', enrollment: 'ZLS-010', balance: 120, status: 'active', health: 'low', lastActivity: '2026-06-14 09:00' },
  // ... more students can be added
];

export const mockBorrowers = [
  { id: 'b1', name: 'Zaid Al-Amin', amount: 4500, status: 'active', risk: 'low', lastPayment: '2026-06-01' },
  { id: 'b2', name: 'Farhan Sheikh', amount: 8000, status: 'overdue', risk: 'high', lastPayment: '2026-05-15' },
  { id: 'b3', name: 'Ismail Noor', amount: 2000, status: 'active', risk: 'medium', lastPayment: '2026-06-10' },
];

export const mockTransactions = [
  { id: 't1', name: 'Ahmed Khan', type: 'deposit', amount: 500, time: '2 hours ago', icon: <ArrowDownLeft size={16} /> },
  { id: 't2', name: 'Store Bill #452', type: 'withdrawal', amount: -120, time: '4 hours ago', icon: <ShoppingBag size={16} /> },
  { id: 't3', name: 'Rahman Aziz', type: 'deposit', amount: 1000, time: '6 hours ago', icon: <ArrowDownLeft size={16} /> },
  { id: 't4', name: 'Basheer Recovery', type: 'recovery', amount: 2000, time: 'Yesterday', icon: <ArrowDownLeft size={16} /> },
  { id: 't5', name: 'Bulk Distribution', type: 'distribution', amount: -5000, time: 'Yesterday', icon: <Package size={16} /> },
];

export const mockActivities = [
  { id: 'a1', title: 'Collection Session Completed', time: '1 hour ago', icon: <CheckCircle2 size={18} className="text-success" />, description: 'Evening collection session for Senior Batch.' },
  { id: 'a2', title: 'Store Bill Event Created', time: '3 hours ago', icon: <ShoppingBag size={18} className="text-primary" />, description: 'Canteen bills for the month of June.' },
  { id: 'a3', title: 'Bulk Distribution Completed', time: 'Yesterday', icon: <Package size={18} className="text-success" />, description: 'Stipend distribution for 150 students.' },
  { id: 'a4', title: 'Recovery Recorded', time: 'Yesterday', icon: <ArrowDownLeft size={18} className="text-success" />, description: 'Loan recovery from Zaid Al-Amin.' },
  { id: 'a5', title: 'Low Balance Alert', time: '2 days ago', icon: <AlertCircle size={18} className="text-warning" />, description: '5 students have fallen below the threshold.' },
];

export const mockBatches = [
  { id: 'batch1', name: 'Store Group', count: 45, type: 'store' },
  { id: 'batch2', name: 'Hostel Group', count: 120, type: 'hostel' },
  { id: 'batch3', name: 'Program Team', count: 15, type: 'program' },
];
