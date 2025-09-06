// This untyped Supabase client avoids TypeScript issues with generated types
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nzaqvnquthazvduelped.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YXF2bnF1dGhhenZkdWVscGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjU4ODgsImV4cCI6MjA3MjY0MTg4OH0.9GItkPv3EDCWGzNv5vgi0cjSa5VYGB1MyKBTzZWIsj4";

export const supabaseUntyped = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);