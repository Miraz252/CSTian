
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzcpelyoufcxxobaivea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Y3BlbHlvdWZjeHhvYmFpdmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODcxMDUsImV4cCI6MjA4NTM2MzEwNX0.G3NoqkdkGIlKCu-DJP-p_DOV0NJffN5ELv4ZBkSBmqo';

export const supabase = createClient(supabaseUrl, supabaseKey);
