import { createClient } from '@supabase/supabase-js'
// Seule la clé "anon" (publique) va ici. Ne mets JAMAIS la clé "service_role".
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
