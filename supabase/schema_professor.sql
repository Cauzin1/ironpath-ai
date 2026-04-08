-- ============================================================
-- IronPath AI — Feature: Professor-Aluno
-- Execute este script completo no Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Cole e clique Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Adicionar coluna "role" na tabela profiles existente
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'aluno'
  CHECK (role IN ('aluno', 'professor'));

-- ─────────────────────────────────────────────────────────────
-- 2. Códigos de convite do professor
--    Um código ativo por professor (UNIQUE trainer_id).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trainer_invites (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_name TEXT        NOT NULL DEFAULT '',
  code         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id),
  UNIQUE(code)
);

ALTER TABLE public.trainer_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_manage_invite" ON public.trainer_invites
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "authenticated_read_invites" ON public.trainer_invites
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Relacionamento professor-aluno
--    Nomes denormalizados para evitar JOIN cross-user.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trainer_students (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT        NOT NULL DEFAULT '',
  trainer_name TEXT        NOT NULL DEFAULT '',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_manage_students" ON public.trainer_students
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "student_view_own_trainer" ON public.trainer_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_join_trainer" ON public.trainer_students
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 4. Biblioteca de treinos do professor
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trainer_workouts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  workouts    JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trainer_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_manage_own_workouts" ON public.trainer_workouts
  FOR ALL USING (trainer_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 5. Treinos atribuídos (snapshot no momento da atribuição)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assigned_workouts (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_workout_id UUID        REFERENCES public.trainer_workouts(id) ON DELETE SET NULL,
  workout_name       TEXT        NOT NULL DEFAULT '',
  workouts           JSONB       NOT NULL DEFAULT '[]',
  trainer_name       TEXT        NOT NULL DEFAULT '',
  assigned_at        TIMESTAMPTZ DEFAULT NOW(),
  is_active          BOOLEAN     NOT NULL DEFAULT FALSE,
  activated_at       TIMESTAMPTZ
);

ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_manage_assignments" ON public.assigned_workouts
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "student_view_assignments" ON public.assigned_workouts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_activate_assignment" ON public.assigned_workouts
  FOR UPDATE USING (student_id = auth.uid());
