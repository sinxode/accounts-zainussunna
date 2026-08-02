import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// read .env file manually
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

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://lyvjrxzmdtzvjshsptvy.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('transaction_presets')
    .select('*')
    .limit(3);
  
  if (error) {
    console.error('Error fetching presets:', error);
    return;
  }
  
  console.log('Presets:', JSON.stringify(data, null, 2));
}

main();
