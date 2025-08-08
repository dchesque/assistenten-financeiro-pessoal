import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrxosfdirgdlvfkzvcuh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeG9zZmRpcmdkbHZma3p2Y3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODY4OTUsImV4cCI6MjA3MDA2Mjg5NX0.1SBE-f-f5lLEc_7rzv87sbVv3WYLLBLi8wsblDwUSCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});