import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvsxvpyhkitbntvvtoos.supabase.co';
const supabaseAnonKey = 'sb_publishable_NKD0sduRIEJGmYrLlY4zFQ_EydEazwL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
