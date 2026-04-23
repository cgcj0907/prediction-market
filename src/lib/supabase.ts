import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example schema for markets table:
// create table markets (
//   id bigint primary key,
//   question text,
//   expires_at timestamp with time zone,
//   creator text,
//   settled boolean default false,
//   outcome text
// );
