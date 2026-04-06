
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  time_limit INTEGER NOT NULL DEFAULT 30,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Teachers can update own quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Teachers can delete own quizzes" ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Quiz creator can insert questions" ON public.questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid()));
CREATE POLICY "Quiz creator can update questions" ON public.questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid()));
CREATE POLICY "Quiz creator can delete questions" ON public.questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid()));

-- Create attempts table
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view attempts for quizzes they created" ON public.attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid()));
CREATE POLICY "Users can insert own attempts" ON public.attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
