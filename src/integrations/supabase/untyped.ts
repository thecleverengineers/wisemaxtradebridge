import { supabase as typedClient } from '@/integrations/supabase/client';

// Use this when the generated Supabase types are out of sync with your database
// to avoid TS errors like `relation: never`. Prefer updating types, but this
// untyped client lets the app compile and run meanwhile.
export const supabaseUntyped = typedClient as unknown as any;
