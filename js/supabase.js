import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://xvtcbkiucwyybdfeewtv.supabase.co";
const supabaseKey = "sb_publishable_HFM3OrxiYdhQrnv2AL8htQ_3_xLNKIJ";

export const supabase = createClient(supabaseUrl, supabaseKey);