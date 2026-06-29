import { supabase } from './frontend/src/lib/supabase.ts';
async function test() {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
  console.log('Query range:', start, end);
  const { data, error } = await supabase
      .from('transactions')
      .select('amount, direction, transaction_date')
      .gte('transaction_date', start)
      .lte('transaction_date', end);
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}
test();
