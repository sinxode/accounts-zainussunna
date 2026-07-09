const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zlbwaqixmjrgxbqflnyp.supabase.co', 'sb_publishable_G5KCrhAcFq6IP4m_8gzpgw_sTFeqfYR');

async function testInsert() {
  try {
    // 1. Get a student
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('id, name')
      .limit(1);

    if (studentErr) {
      console.error('Error fetching student:', studentErr);
      return;
    }
    if (!students || students.length === 0) {
      console.log('No students found in database.');
      return;
    }
    const student = students[0];
    console.log('Using student:', student);

    // 2. Get a user profile
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);

    if (profileErr) {
      console.error('Error fetching profile:', profileErr);
      return;
    }
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database.');
      return;
    }
    const profile = profiles[0];
    console.log('Using profile:', profile);

    // 3. Attempt insert
    const mockTx = {
      student_id: student.id,
      operation_id: '00000000-0000-0000-0000-000000000000',
      transaction_type: 'deposit',
      direction: 'credit',
      amount: 10.00,
      purpose: 'Test Bulk Insertion Diagnostics',
      transaction_date: new Date().toISOString(),
      created_by: profile.id
    };

    console.log('Attempting mock transaction insert:', mockTx);
    const { data, error } = await supabase
      .from('transactions')
      .insert([mockTx])
      .select()
      .single();

    if (error) {
      console.error('INSERT FAILED with error:', error);
    } else {
      console.log('INSERT SUCCESS:', data);
    }
  } catch (err) {
    console.error('Catch block error:', err);
  }
}

testInsert();
