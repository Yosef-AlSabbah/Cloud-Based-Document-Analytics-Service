// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cexlywbdmufhozflgxis.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGx5d2JkbXVmaG96ZmxneGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMjkyODUsImV4cCI6MjA2NDYwNTI4NX0.zgbNc7viVoARK9kUgGbudSrOVSk4WhKQNJzeIq0ykoM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);