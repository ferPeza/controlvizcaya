import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vpxkzsghleglvlwivxky.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweGt6c2dobGVnbHZsd2l2eGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTg3NjgsImV4cCI6MjEwNDg5NDc2OH0.D-QcJxtXhouJ0okXliwwwFvDcoaYnq8DU4AMZlVx9rc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
