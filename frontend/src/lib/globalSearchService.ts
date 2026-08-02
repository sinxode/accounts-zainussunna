import { supabase } from './supabase';
import { formatDisplayName } from './utils';

export const globalSearchService = {
  async search(query: string) {
    if (query.length < 2) return [];

    // 1. Search Students
    const { data: students } = await supabase
      .from('students')
      .select('id, name, enrolment_no')
      .or(`name.ilike.%${query}%,enrolment_no.ilike.%${query}%`)
      .limit(5);

    // 2. Search Borrowers
    const { data: borrowers } = await supabase
      .from('borrowers')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(5);

    // 3. Search Events
    const { data: events } = await supabase
      .from('events')
      .select('id, event_name, event_type')
      .ilike('event_name', `%${query}%`)
      .limit(5);

    // 4. Search Transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, purpose, amount')
      .ilike('purpose', `%${query}%`)
      .limit(5);

    return [
      ...(students?.map(s => ({ id: s.id, title: formatDisplayName(s.name), sub: s.enrolment_no, type: 'Student', path: `/students/${s.id}` })) || []),
      ...(borrowers?.map(b => ({ id: b.id, title: b.name, sub: 'Outside Borrower', type: 'Borrower', path: `/borrowers/${b.id}` })) || []),
      ...(events?.map(e => ({ id: e.id, title: e.event_name, sub: e.event_type.replace('_', ' '), type: 'Event', path: `/events/workspace/${e.id}` })) || []),
      ...(transactions?.map(t => ({ id: t.id, title: t.purpose, sub: `₹${t.amount}`, type: 'Transaction', path: `/transactions/${t.id}` })) || []),
    ];
  }
};
