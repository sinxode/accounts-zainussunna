import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Supabase Anon Key:', supabaseKey ? supabaseKey.slice(0, 15) + '...' : 'undefined');

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const res = await supabase
    .from('students')
    .select('id, name', { count: 'exact' });
  
  if (res.error) {
    console.error('Error fetching students:', res.error);
    return;
  }
  
  console.log('Total students count in DB:', res.count);
  console.log('Data returned:', res.data);
}

main();
