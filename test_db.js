const { createClient } = require('@supabase/supabase-js');
// Need to mock environment variables for the script
const supabase = createClient('https://zlbwaqixmjrgxbqflnyp.supabase.co/', 'sb_publishable_G5KCrhAcFq6IP4m_8gzpgw_sTFeqfYR');
async function test() {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
  console.log('Querying transactions range:', start, 'to', end);
  const { data, error } = await supabase
      .from('transactions')
      .select('amount, direction, transaction_date')
      .gte('transaction_date', start)
      .lte('transaction_date', end);
  if (error) console.error('Error:', error);
  else console.log('Found transactions:', data.length, data);
}
test();
