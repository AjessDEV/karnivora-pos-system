import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://xrqkvnwdnrkydkofkzpc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycWt2bndkbnJreWRrb2ZrenBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTMwNDIsImV4cCI6MjA2MjYyOTA0Mn0.JgXz1HQRKZ68dnazf_Ttq4tOovUtph9pOnvPa5GI-_w'
export const supabase = createClient(supabaseUrl, supabaseKey)