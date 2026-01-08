import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jdiozxhwkmvyejtqbksk.supabase.co"; // ⬅️ Replace with your project URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaW96eGh3a212eWVqdHFia3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzc5NDUsImV4cCI6MjA3NTkxMzk0NX0.aIEr28HNrKd8BHngIclEwLZrM0TY00hzxSWyaxKGxN0"; // ⬅️ Replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
