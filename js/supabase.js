import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://xvtcbkiucwyybdfeewtv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGNia2l1Y3d5eWJkZmVld3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzQyNTQsImV4cCI6MjA5MTUxMDI1NH0.8iWkuN5qDgo0iMHCOH6K0dx1J0WNgxC_3z2y4ixIbdA"; 
// a anon public, não a publishable

export const supabase = createClient(supabaseUrl, supabaseKey);
