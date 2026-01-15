import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://byhrayteqggzlnmzjyay.supabase.co'
const supabaseAnonKey = 'sb_publishable_sxJuii0jFmTB9yzPujUsKA_ZGAn7Xlr'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
