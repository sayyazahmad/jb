import { createClient } from '@supabase/supabase-js';
import { INITIAL_DONATIONS } from '../src/data/initialData';
import { toDbRow } from '../src/services/supabase';

const SUPABASE_URL = 'https://hyrhdahslleditthpqni.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__DRMyyi-MEWUY_c2UyQ69w_0YGRVQIO';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSeed() {
  console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
  console.log(`Total donations to seed: ${INITIAL_DONATIONS.length}`);

  // Test table existence
  const { data: testData, error: testError } = await supabase
    .from('donations')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('Test query failed:', testError.message, 'Code:', testError.code);
    if (testError.code === '42P01' || testError.message.includes('relation "public.donations" does not exist') || testError.message.includes('not found')) {
      console.log('\n❌ Table "donations" does not exist in Supabase yet.');
      console.log('Please run the SQL schema creation script in your Supabase SQL editor.\n');
    }
    return;
  }

  console.log('✅ Table "donations" is accessible. Starting batch upload...');

  const chunkSize = 25;
  let successCount = 0;

  for (let i = 0; i < INITIAL_DONATIONS.length; i += chunkSize) {
    const chunk = INITIAL_DONATIONS.slice(i, i + chunkSize).map(toDbRow);
    const { error } = await supabase.from('donations').upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`Error uploading batch ${i} - ${i + chunk.length}:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`Uploaded ${successCount} / ${INITIAL_DONATIONS.length} records...`);
    }
  }

  // Verify total count
  const { count, error: countError } = await supabase
    .from('donations')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn('Count verification warning:', countError.message);
  } else {
    console.log(`\n🎉 Success! Total verified records in Supabase 'donations' table: ${count}`);
  }
}

runSeed().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
