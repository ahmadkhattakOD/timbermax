import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_KEY ?? "";
const supabaseServiceRoleKey =
  import.meta.env.VITE_APP_SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for operations that require service role key (like creating users)
const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export default supabase;
export { supabaseAdmin };
