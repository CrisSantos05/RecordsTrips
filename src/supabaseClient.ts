import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://byhrayteqggzlnmzjyay.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sxJuii0jFmTB9yzPujUsKA_ZGAn7Xlr'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
