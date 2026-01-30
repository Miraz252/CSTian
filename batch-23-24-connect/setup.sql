
-- 1. CLEAN START
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  roll_number TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint here
  name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  gpa_history NUMERIC[] DEFAULT '{0, 0, 0}',
  social_links JSONB DEFAULT '{"facebook": "", "messenger": "", "linkedin": ""}'::jsonb,
  role TEXT DEFAULT 'student',
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTICES TABLE
CREATE TABLE public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MESSAGES TABLE
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL, -- Storing Roll Number
  sender_name TEXT NOT NULL,
  sender_image TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. PERMISSIVE POLICIES FOR AUTHENTICATED USERS
CREATE POLICY "authenticated_profiles_access" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_notices_access" ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_messages_access" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
