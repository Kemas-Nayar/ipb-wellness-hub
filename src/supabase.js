import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://keefvvcpjdsbnboghhfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZWZ2dmNwamRzYm5ib2doaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTA4MzUsImV4cCI6MjA5MTk2NjgzNX0.BW03xs-BN25e0PwqdaC9juZyuGtqJ7dUXlFaf5j6HA8';

export const supabase = createClient(supabaseUrl, supabaseKey);