-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  radius INTEGER DEFAULT 500,
  skills TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'now' CHECK (availability IN ('now', 'later', 'this-week')),
  credits INTEGER DEFAULT 5,
  tasks_completed INTEGER DEFAULT 0,
  reliability_score NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_description TEXT,
  time_estimate TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('urgent', 'normal', 'flexible')),
  category TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  approx_address TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arrived', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, helper_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Anyone can view open tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Owners can update own tasks" ON public.tasks FOR UPDATE USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Owners can delete own tasks" ON public.tasks FOR DELETE USING (owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (
  helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT WITH CHECK (helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Participants can update matches" ON public.matches FOR UPDATE USING (
  helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Messages policies
CREATE POLICY "Match participants can view messages" ON public.messages FOR SELECT USING (
  match_id IN (SELECT id FROM public.matches WHERE 
    helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);
CREATE POLICY "Match participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
  match_id IN (SELECT id FROM public.matches WHERE 
    helper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    task_id IN (SELECT id FROM public.tasks WHERE owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

-- Enable realtime for tasks and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();