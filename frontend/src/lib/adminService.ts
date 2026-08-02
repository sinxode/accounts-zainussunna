import { supabase } from './supabase';
import { formatDisplayName } from './utils';
import type { Database } from '../types/database';

export const adminService = {
  /**
   * Periods
   */
  async getPeriods() {
    const { data, error } = await supabase
      .from('accounting_periods')
      .select('*, profiles(full_name)')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createPeriod(year: number, month: number) {
    const { data, error } = await supabase
      .from('accounting_periods')
      .insert({ period_year: year, period_month: month, is_locked: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async togglePeriodLock(id: string, isLocked: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('accounting_periods')
      .update({ 
        is_locked: isLocked,
        locked_at: isLocked ? new Date().toISOString() : null,
        locked_by: isLocked ? user?.id : null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Users
   */
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) throw error;
    return data;
  },

  async updateUserRole(id: string, role: Database['public']['Tables']['profiles']['Row']['role']) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  /**
   * Audit Logs
   */
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  /**
   * Settings
   */
  async getSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    return data;
  },

  async updateSetting(key: string, value: unknown) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  /**
   * Admin Dashboard Stats
   */
  async getDashboardStats() {
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    const { count: totalAuditLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { data: periodData } = await supabase
      .from('accounting_periods')
      .select('*')
      .eq('period_year', currentYear)
      .eq('period_month', currentMonth)
      .maybeSingle();

    return {
      activeUsers: activeUsers || 0,
      unreadNotifications: unreadNotifications || 0,
      totalAuditLogs: totalAuditLogs || 0,
      currentPeriod: periodData ? {
        name: `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
        isLocked: periodData.is_locked
      } : {
        name: `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
        isLocked: false
      }
    };
  },

  /**
   * Notifications
   */
  async getNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async resolveNotification(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Diagnostics and health pings
   */
  async pingDatabase() {
    const start = performance.now();
    await supabase.from('profiles').select('id').limit(1);
    return Math.round(performance.now() - start);
  },

  async pingAuth() {
    const start = performance.now();
    await supabase.auth.getSession();
    return Math.round(performance.now() - start);
  },

  async getStudentLedger() {
    const { data, error } = await supabase
      .from('student_health')
      .select('*')
      .order('current_balance', { ascending: true });
    if (error) {
      console.error('Failed to fetch student ledger', error);
      return [];
    }
    return data || [];
  },

  async getTransactionHistory() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(name, enrolment_no)');
    if (error) {
      console.error('Failed to fetch transactions', error);
      return [];
    }
    const list = data || [];
    return list.map(item => {
      if (item.students) {
        item.students.name = formatDisplayName(item.students.name);
      }
      return item;
    });
  },

  async getDiagnosticLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return (data || []).map((l, index) => ({
      id: index + 1,
      event: l.action.replace(/_/g, ' '),
      time: new Date(l.created_at).toLocaleTimeString() + ' (' + new Date(l.created_at).toLocaleDateString() + ')',
      status: l.action.includes('ERROR') || l.action.includes('FAIL') ? 'error' as const : 'success' as const
    }));
  },


  /**
   * Data Integrity Checks
   */
  async getDataIntegrityStats() {
    // 1. Negative balance students
    const { count: negativeStudents } = await supabase
      .from('student_health')
      .select('*', { count: 'exact', head: true })
      .eq('health_status', 'negative');

    // 2. Overdue borrowers
    const { count: overdueBorrowers } = await supabase
      .from('borrowers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue');

    // 3. Total students and transactions to verify basic stats
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // 4. Calculate an overall integrity score
    const negativeCount = negativeStudents || 0;
    const overdueCount = overdueBorrowers || 0;
    const penalty = (negativeCount * 3) + (overdueCount * 5);
    const score = Math.max(0, Math.min(100, 100 - penalty));

    return {
      negativeStudents: negativeCount,
      overdueBorrowers: overdueCount,
      totalStudents: totalStudents || 0,
      score: score
    };
  }
};

